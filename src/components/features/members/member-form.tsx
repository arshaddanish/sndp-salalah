'use client';

import { UserMinus, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { FormFieldError } from '@/components/ui/form-field-error';
import { Input } from '@/components/ui/input';
import { createMember, updateMember } from '@/lib/actions/members';
import { uploadMemberPhoto } from '@/lib/s3/member-photo-upload';
import { createMemberSchema, updateMemberSchema } from '@/lib/validations/members';
import type { CreateMemberInput, Member } from '@/types/members';

type FamilyRow = {
  id: string;
  name: string;
  relation: string;
  dob: string;
};

type Option = {
  label: string;
  value: string;
};

type MemberFormProps = {
  shakhaOptions: Option[];
  initialData?: Member;
};

const maritalStatusOptions = ['Married', 'Single', 'Divorced', 'Widowed'];
const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const familyRelationOptions = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other'];
const districtOptions = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
];

function createFamilyRow(): FamilyRow {
  return {
    id: crypto.randomUUID(),
    name: '',
    relation: '',
    dob: '',
  };
}

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value : '';
}

function mapZodIssues(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  const next: Record<string, string> = {};

  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (key.length > 0 && !next[key]) {
      next[key] = issue.message;
    }
  }

  return next;
}

function initFamilyRows(member?: Member): FamilyRow[] {
  return (
    member?.family_members?.map((fm) => ({
      id: fm.id,
      name: fm.name,
      relation: fm.relation ?? '',
      dob: fm.dob ? fm.dob.toISOString().slice(0, 10) : '',
    })) ?? []
  );
}

function filterFamilyRows(rows: FamilyRow[], rowIndex: number): FamilyRow[] {
  if (rowIndex < 0 || rowIndex >= rows.length) {
    return rows;
  }
  return rows.filter((_, i) => i !== rowIndex);
}

function shiftFamilyFieldErrors(
  errors: Record<string, string>,
  rowIndex: number,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    const m = /^familyMembers\.(\d+)\.(.+)$/.exec(key);
    if (!m) {
      next[key] = value;
      continue;
    }
    const index = Number.parseInt(m[1] ?? '-1', 10);
    const fieldKey = m[2];
    if (index === rowIndex) continue;
    if (index > rowIndex) {
      next[`familyMembers.${index - 1}.${fieldKey}`] = value;
      continue;
    }
    next[key] = value;
  }
  return next;
}

function updateFamilyRowInList(
  rows: FamilyRow[],
  index: number,
  key: keyof FamilyRow,
  value: string,
): FamilyRow[] {
  const next = [...rows];
  const existing = next[index];
  if (!existing) return rows;
  next[index] = { ...existing, [key]: value };
  return next;
}

type SubmitContext = {
  isEditMode: boolean;
  initialData: Member | undefined;
  payload: CreateMemberInput;
  photoFile: File | null;
};

type RouterPush = ReturnType<typeof useRouter>['push'];

type SubmitCallbacks = {
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  push: RouterPush;
};

async function runMemberSubmit(
  { isEditMode, initialData, payload, photoFile }: SubmitContext,
  { setFieldErrors, setErrorMessage, push }: SubmitCallbacks,
): Promise<void> {
  let photoKey = initialData?.photo_key ?? '';
  if (photoFile) {
    const uploadResult = await uploadMemberPhoto(photoFile);
    photoKey = uploadResult.photoKey;
  }
  if (isEditMode && initialData) {
    const updatePayload = { ...payload, photoKey };
    const vr = updateMemberSchema.safeParse(updatePayload);
    if (!vr.success) {
      setFieldErrors(mapZodIssues(vr.error.issues));
      return;
    }
    const result = await updateMember(initialData.id, vr.data);
    if (!result.success || !result.data) {
      setErrorMessage(result.error ?? 'Unable to update member. Please try again.');
      return;
    }
    push(`/members/${initialData.member_code}`);
  } else {
    const payloadWithPhoto: CreateMemberInput = { ...payload, photoKey };
    const vr = createMemberSchema.safeParse(payloadWithPhoto);
    if (!vr.success) {
      setFieldErrors(mapZodIssues(vr.error.issues));
      return;
    }
    const result = await createMember(vr.data);
    if (!result.success || !result.data) {
      setErrorMessage(result.error ?? 'Unable to create member. Please try again.');
      return;
    }
    push(`/members/${result.data.memberCode}`);
  }
}

export function MemberForm({ shakhaOptions, initialData }: Readonly<MemberFormProps>) {
  const isEditMode = Boolean(initialData);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isFamilyInOman, setIsFamilyInOman] = useState(initialData?.is_family_in_oman ?? false);
  const [familyRows, setFamilyRows] = useState<FamilyRow[]>(() => initFamilyRows(initialData));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleFormChange = useCallback(() => setIsDirty(true), []);

  const addFamilyRow = () => {
    setFamilyRows((currentRows) => [...currentRows, createFamilyRow()]);
    setIsDirty(true);
  };

  const removeFamilyRow = (rowIndex: number) => {
    setFamilyRows((rows) => filterFamilyRows(rows, rowIndex));
    setFieldErrors((errors) => shiftFamilyFieldErrors(errors, rowIndex));
    setIsDirty(true);
  };

  const updateFamilyRow = (index: number, key: keyof FamilyRow, value: string) => {
    setFamilyRows((rows) => updateFamilyRowInList(rows, index, key, value));
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[`familyMembers.${index}.${key}`];
      return nextErrors;
    });
  };

  const handleSubmit = (event: { preventDefault: () => void; currentTarget: HTMLFormElement }) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    const payload: CreateMemberInput = {
      name: getFormValue(formData, 'name'),
      dob: getFormValue(formData, 'dob'),
      profession: getFormValue(formData, 'profession'),
      whatsappNo: getFormValue(formData, 'whatsappNo'),
      gsmNo: getFormValue(formData, 'gsmNo'),
      familyStatus: getFormValue(formData, 'familyStatus'),
      bloodGroup: getFormValue(formData, 'bloodGroup'),
      residentialArea: getFormValue(formData, 'residentialArea'),
      civilIdNo: getFormValue(formData, 'civilIdNo'),
      passportNo: getFormValue(formData, 'passportNo'),
      email: getFormValue(formData, 'email'),
      telNoIndia: getFormValue(formData, 'telNoIndia'),
      addressIndia: getFormValue(formData, 'addressIndia'),
      isFamilyInOman,
      familyMembers: familyRows,
      shakhaIndia: getFormValue(formData, 'shakhaIndia'),
      unionName: getFormValue(formData, 'unionName'),
      district: getFormValue(formData, 'district'),
      officeShakhaId: getFormValue(formData, 'officeShakhaId'),
      submittedBy: getFormValue(formData, 'submittedBy'),
      approvedBy: getFormValue(formData, 'approvedBy'),
      receivedOn: getFormValue(formData, 'receivedOn'),
      checkedBy: getFormValue(formData, 'checkedBy'),
      applicationNo: getFormValue(formData, 'applicationNo'),
      secretary: getFormValue(formData, 'secretary'),
      president: getFormValue(formData, 'president'),
      photoKey: '',
    };

    // Resolve photoKey: file selected takes priority; edit mode preserves existing key.
    if (photoFile) {
      payload.photoKey = 'pending_upload';
    } else if (isEditMode) {
      payload.photoKey = initialData?.photo_key ?? '';
    }

    const validationSchema = isEditMode ? updateMemberSchema : createMemberSchema;
    const cvr = validationSchema.safeParse(payload);
    if (!cvr.success) {
      setFieldErrors(mapZodIssues(cvr.error.issues));
      return;
    }

    startTransition(async () => {
      try {
        await runMemberSubmit(
          { isEditMode, initialData, payload, photoFile },
          { setFieldErrors, setErrorMessage, push: router.push },
        );
      } catch (error) {
        console.error('Unexpected error during member submit:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    });
  };

  let submitLabel = 'Save Member';
  if (isEditMode) {
    submitLabel = 'Update Member';
  }
  if (isPending) {
    submitLabel = 'Saving...';
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={handleFormChange}
      className="border-border bg-surface space-y-8 rounded-xl border p-6"
    >
      <fieldset className="space-y-4">
        <legend className="text-text-primary mb-3 text-sm font-semibold">General Details</legend>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="name">
              Name *
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name ?? ''}
              disabled={isPending}
            />
            <FormFieldError fieldErrors={fieldErrors} fieldKey="name" errorId="name-error" />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="profession">
              Profession *
            </label>
            <Input
              id="profession"
              name="profession"
              defaultValue={initialData?.profession ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="profession"
              errorId="profession-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="dob">
              DOB *
            </label>
            <Input
              id="dob"
              name="dob"
              type="date"
              defaultValue={initialData?.dob ? initialData.dob.toISOString().slice(0, 10) : ''}
              disabled={isPending}
            />
            <FormFieldError fieldErrors={fieldErrors} fieldKey="dob" errorId="dob-error" />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="whatsappNo">
              Whatsapp No *
            </label>
            <Input
              id="whatsappNo"
              name="whatsappNo"
              defaultValue={initialData?.whatsapp_no ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="whatsappNo"
              errorId="whatsappNo-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="gsmNo">
              GSM No *
            </label>
            <Input
              id="gsmNo"
              name="gsmNo"
              defaultValue={initialData?.gsm_no ?? ''}
              disabled={isPending}
            />
            <FormFieldError fieldErrors={fieldErrors} fieldKey="gsmNo" errorId="gsmNo-error" />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="familyStatus">
              Marital Status
            </label>
            <select
              id="familyStatus"
              name="familyStatus"
              disabled={isPending}
              className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              defaultValue={initialData?.family_status ?? ''}
            >
              <option value="">Select status</option>
              {maritalStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="bloodGroup">
              Blood Group
            </label>
            <select
              id="bloodGroup"
              name="bloodGroup"
              disabled={isPending}
              className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              defaultValue={initialData?.blood_group ?? ''}
            >
              <option value="">Select blood group</option>
              {bloodGroupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="residentialArea">
              Residential Area *
            </label>
            <Input
              id="residentialArea"
              name="residentialArea"
              defaultValue={initialData?.residential_area ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="residentialArea"
              errorId="residentialArea-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData?.email ?? ''}
              disabled={isPending}
            />
            <FormFieldError fieldErrors={fieldErrors} fieldKey="email" errorId="email-error" />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="civilIdNo">
              Civil ID No *
            </label>
            <Input
              id="civilIdNo"
              name="civilIdNo"
              defaultValue={initialData?.civil_id_no ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="civilIdNo"
              errorId="civilIdNo-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="passportNo">
              Passport No *
            </label>
            <Input
              id="passportNo"
              name="passportNo"
              defaultValue={initialData?.passport_no ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="passportNo"
              errorId="passportNo-error"
            />
          </div>

          {!isEditMode && (
            <div className="space-y-1.5">
              <label className="text-text-secondary text-sm font-medium" htmlFor="photo">
                Photo *
              </label>
              <Input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                disabled={isPending}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setPhotoFile(nextFile);
                  setFieldErrors((currentErrors) => {
                    const nextErrors = { ...currentErrors };
                    delete nextErrors['photoKey'];
                    return nextErrors;
                  });
                }}
              />
              <FormFieldError
                fieldErrors={fieldErrors}
                fieldKey="photoKey"
                errorId="photoKey-error"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="telNoIndia">
              Telephone No(India)
            </label>
            <Input
              id="telNoIndia"
              name="telNoIndia"
              defaultValue={initialData?.tel_no_india ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="telNoIndia"
              errorId="telNoIndia-error"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="addressIndia">
            Address In India *
          </label>
          <textarea
            id="addressIndia"
            name="addressIndia"
            rows={3}
            defaultValue={initialData?.address_india ?? ''}
            disabled={isPending}
            className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-accent-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <FormFieldError
            fieldErrors={fieldErrors}
            fieldKey="addressIndia"
            errorId="addressIndia-error"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-text-secondary text-sm font-medium">Family residing in Oman?</p>
          <div className="flex items-center gap-6 py-1">
            <div className="flex items-center gap-2">
              <input
                id="isFamilyInOmanYes"
                type="radio"
                name="isFamilyInOman"
                checked={isFamilyInOman}
                onChange={() => setIsFamilyInOman(true)}
                disabled={isPending}
              />
              <label className="text-text-primary text-sm" htmlFor="isFamilyInOmanYes">
                Yes
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isFamilyInOmanNo"
                type="radio"
                name="isFamilyInOman"
                checked={!isFamilyInOman}
                onChange={() => setIsFamilyInOman(false)}
                disabled={isPending}
              />
              <label className="text-text-primary text-sm" htmlFor="isFamilyInOmanNo">
                No
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="border-border space-y-4 border-t pt-6">
        <legend className="text-text-primary mb-3 text-sm font-semibold">Family Members</legend>

        <div className="space-y-3">
          {familyRows.length === 0 ? (
            <p className="text-text-secondary text-sm">No family members added.</p>
          ) : null}

          {familyRows.map((row, index) => (
            <div key={row.id} className="grid items-end gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
              <div className="space-y-1.5">
                <label
                  className="text-text-secondary text-sm font-medium"
                  htmlFor={`family-name-${index}`}
                >
                  Name *
                </label>
                <Input
                  id={`family-name-${index}`}
                  value={row.name}
                  disabled={isPending}
                  onChange={(event) => updateFamilyRow(index, 'name', event.target.value)}
                />
                <FormFieldError
                  fieldErrors={fieldErrors}
                  fieldKey={`familyMembers.${index}.name`}
                  errorId={`family-name-error-${index}`}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-text-secondary text-sm font-medium"
                  htmlFor={`family-relation-${index}`}
                >
                  Relation
                </label>
                <select
                  id={`family-relation-${index}`}
                  value={row.relation}
                  disabled={isPending}
                  onChange={(event) => updateFamilyRow(index, 'relation', event.target.value)}
                  className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                >
                  <option value="">Select relation</option>
                  {familyRelationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-text-secondary text-sm font-medium"
                  htmlFor={`family-dob-${index}`}
                >
                  DOB
                </label>
                <Input
                  id={`family-dob-${index}`}
                  type="date"
                  value={row.dob}
                  disabled={isPending}
                  onChange={(event) => updateFamilyRow(index, 'dob', event.target.value)}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFamilyRow(index)}
                disabled={isPending}
                aria-label={`Remove family member row ${index + 1}`}
              >
                <UserMinus />
              </Button>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addFamilyRow}
              disabled={isPending}
              aria-label="Add family member row"
            >
              <UserPlus />
              Add Row
            </Button>
          </div>
        </div>
      </fieldset>

      <fieldset className="border-border space-y-4 border-t pt-6">
        <legend className="text-text-primary mb-3 text-sm font-semibold">
          SNDP India Unit Details
        </legend>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="shakhaIndia">
              Shakha
            </label>
            <Input
              id="shakhaIndia"
              name="shakhaIndia"
              defaultValue={initialData?.shakha_india ?? ''}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="unionName">
              Union
            </label>
            <Input
              id="unionName"
              name="unionName"
              defaultValue={initialData?.union_name ?? ''}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="district">
              District
            </label>
            <select
              id="district"
              name="district"
              disabled={isPending}
              className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              defaultValue={initialData?.district ?? ''}
            >
              <option value="">Select district</option>
              {districtOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="border-border space-y-4 border-t pt-6">
        <legend className="text-text-primary mb-3 text-sm font-semibold">For Office Use</legend>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="officeShakhaId">
              Shakha *
            </label>
            <select
              id="officeShakhaId"
              name="officeShakhaId"
              defaultValue={initialData?.shakha_id ?? ''}
              disabled={isPending}
              className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            >
              <option value="">Select shakha</option>
              {shakhaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="officeShakhaId"
              errorId="officeShakhaId-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="submittedBy">
              Submitted By *
            </label>
            <Input
              id="submittedBy"
              name="submittedBy"
              defaultValue={initialData?.submitted_by ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="submittedBy"
              errorId="submittedBy-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="receivedOn">
              Received On *
            </label>
            <Input
              id="receivedOn"
              name="receivedOn"
              type="date"
              defaultValue={
                initialData?.received_on ? initialData.received_on.toISOString().slice(0, 10) : ''
              }
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="receivedOn"
              errorId="receivedOn-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="approvedBy">
              Approved By *
            </label>
            <Input
              id="approvedBy"
              name="approvedBy"
              defaultValue={initialData?.approved_by ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="approvedBy"
              errorId="approvedBy-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="checkedBy">
              Checked By *
            </label>
            <Input
              id="checkedBy"
              name="checkedBy"
              defaultValue={initialData?.checked_by ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="checkedBy"
              errorId="checkedBy-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="applicationNo">
              Application No *
            </label>
            <Input
              id="applicationNo"
              name="applicationNo"
              defaultValue={initialData?.application_no ?? ''}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="applicationNo"
              errorId="applicationNo-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="secretary">
              Secretary
            </label>
            <Input
              id="secretary"
              name="secretary"
              defaultValue={initialData?.secretary ?? ''}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="president">
              President
            </label>
            <Input
              id="president"
              name="president"
              defaultValue={initialData?.president ?? ''}
              disabled={isPending}
            />
          </div>
        </div>
      </fieldset>

      {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

      <div className="flex items-center justify-end gap-3">
        {isEditMode && !isDirty && !isPending ? (
          <p className="text-text-muted mr-auto text-sm">Make a change to enable save.</p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            router.push(isEditMode ? `/members/${initialData!.member_code}` : '/members')
          }
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || (isEditMode && !isDirty)}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
