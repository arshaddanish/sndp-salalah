'use client';

import { UserMinus, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEventHandler, useMemo, useState, useTransition } from 'react';
import type { ZodIssue } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createMember } from '@/lib/actions/members';
import { uploadMemberPhoto } from '@/lib/s3/member-photo-upload';
import { createMemberSchema } from '@/lib/validations/members';
import type { CreateMemberInput } from '@/types/members';

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
  memberCodePreview: number;
  shakhaOptions: Option[];
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

function mapZodIssues(issues: ZodIssue[]): Record<string, string> {
  const next: Record<string, string> = {};

  for (const issue of issues) {
    const key = issue.path.join('.');
    if (key.length > 0 && !next[key]) {
      next[key] = issue.message;
    }
  }

  return next;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function MemberForm({ memberCodePreview, shakhaOptions }: Readonly<MemberFormProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isFamilyInOman, setIsFamilyInOman] = useState(false);
  const [familyRows, setFamilyRows] = useState<FamilyRow[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const defaultExpiry = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().slice(0, 10);
  }, []);

  const addFamilyRow = () => {
    setFamilyRows((currentRows) => [...currentRows, createFamilyRow()]);
  };

  const removeFamilyRow = () => {
    setFamilyRows((currentRows) => {
      if (currentRows.length === 0) {
        return currentRows;
      }

      return currentRows.slice(0, -1);
    });
  };

  const updateFamilyRow = (index: number, key: keyof FamilyRow, value: string) => {
    setFamilyRows((currentRows) => {
      const nextRows = [...currentRows];
      const existingRow = nextRows[index];
      if (!existingRow) {
        return currentRows;
      }

      nextRows[index] = {
        ...existingRow,
        [key]: value,
      };

      return nextRows;
    });

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[`familyMembers.${index}.${key}`];
      return nextErrors;
    });
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    const payload: CreateMemberInput = {
      memberCodePreview,
      name: String(formData.get('name') ?? ''),
      dob: String(formData.get('dob') ?? ''),
      profession: String(formData.get('profession') ?? ''),
      whatsappNo: String(formData.get('whatsappNo') ?? ''),
      gsmNo: String(formData.get('gsmNo') ?? ''),
      familyStatus: String(formData.get('familyStatus') ?? ''),
      bloodGroup: String(formData.get('bloodGroup') ?? ''),
      residentialArea: String(formData.get('residentialArea') ?? ''),
      civilIdNo: String(formData.get('civilIdNo') ?? ''),
      passportNo: String(formData.get('passportNo') ?? ''),
      email: String(formData.get('email') ?? ''),
      telNoIndia: String(formData.get('telNoIndia') ?? ''),
      addressIndia: String(formData.get('addressIndia') ?? ''),
      isFamilyInOman,
      familyMembers: familyRows,
      shakhaIndia: String(formData.get('shakhaIndia') ?? ''),
      union: String(formData.get('union') ?? ''),
      district: String(formData.get('district') ?? ''),
      officeShakhaId: String(formData.get('officeShakhaId') ?? ''),
      submittedBy: String(formData.get('submittedBy') ?? ''),
      approvedBy: String(formData.get('approvedBy') ?? ''),
      receivedOn: String(formData.get('receivedOn') ?? ''),
      checkedBy: String(formData.get('checkedBy') ?? ''),
      expiry: String(formData.get('expiry') ?? ''),
      applicationNo: String(formData.get('applicationNo') ?? ''),
      secretary: String(formData.get('secretary') ?? ''),
      president: String(formData.get('president') ?? ''),
      photoKey: '',
    };

    if (!photoFile) {
      setFieldErrors({ photoKey: 'Photo is required' });
      return;
    }

    startTransition(async () => {
      const uploadResult = await uploadMemberPhoto(photoFile);
      const payloadWithPhoto: CreateMemberInput = {
        ...payload,
        photoKey: uploadResult.photoKey,
      };

      const validationResult = createMemberSchema.safeParse(payloadWithPhoto);
      if (!validationResult.success) {
        setFieldErrors(mapZodIssues(validationResult.error.issues));
        setErrorMessage('Please fix validation errors before submitting.');
        return;
      }

      const result = await createMember(validationResult.data);
      if (!result.success || !result.data) {
        setErrorMessage(result.error ?? 'Unable to create member. Please try again.');
        return;
      }

      router.push(`/members/${result.data.id}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-surface space-y-8 rounded-xl border p-6"
    >
      <fieldset className="space-y-4">
        <legend className="text-text-primary mb-3 text-sm font-semibold">General Details</legend>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="memberCodePreview">
              Member ID *
            </label>
            <Input id="memberCodePreview" value={String(memberCodePreview)} readOnly />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="name">
              Name *
            </label>
            <Input id="name" name="name" disabled={isPending} />
            {fieldErrors['name'] ? (
              <p className="text-danger text-xs">{fieldErrors['name']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="profession">
              Profession *
            </label>
            <Input id="profession" name="profession" disabled={isPending} />
            {fieldErrors['profession'] ? (
              <p className="text-danger text-xs">{fieldErrors['profession']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="dob">
              DOB *
            </label>
            <Input id="dob" name="dob" type="date" disabled={isPending} />
            {fieldErrors['dob'] ? (
              <p className="text-danger text-xs">{fieldErrors['dob']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="whatsappNo">
              Whatsapp No *
            </label>
            <Input id="whatsappNo" name="whatsappNo" disabled={isPending} />
            {fieldErrors['whatsappNo'] ? (
              <p className="text-danger text-xs">{fieldErrors['whatsappNo']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="gsmNo">
              GSM No *
            </label>
            <Input id="gsmNo" name="gsmNo" disabled={isPending} />
            {fieldErrors['gsmNo'] ? (
              <p className="text-danger text-xs">{fieldErrors['gsmNo']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="familyStatus">
              Marital Status
            </label>
            <select
              id="familyStatus"
              name="familyStatus"
              disabled={isPending}
              className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              defaultValue=""
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
              className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              defaultValue=""
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
            <Input id="residentialArea" name="residentialArea" disabled={isPending} />
            {fieldErrors['residentialArea'] ? (
              <p className="text-danger text-xs">{fieldErrors['residentialArea']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input id="email" name="email" type="email" disabled={isPending} />
            {fieldErrors['email'] ? (
              <p className="text-danger text-xs">{fieldErrors['email']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="civilIdNo">
              Civil ID No *
            </label>
            <Input id="civilIdNo" name="civilIdNo" disabled={isPending} />
            {fieldErrors['civilIdNo'] ? (
              <p className="text-danger text-xs">{fieldErrors['civilIdNo']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="passportNo">
              Passport No *
            </label>
            <Input id="passportNo" name="passportNo" disabled={isPending} />
            {fieldErrors['passportNo'] ? (
              <p className="text-danger text-xs">{fieldErrors['passportNo']}</p>
            ) : null}
          </div>

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
            {fieldErrors['photoKey'] ? (
              <p className="text-danger text-xs">{fieldErrors['photoKey']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="telNoIndia">
              Telephone No(India)
            </label>
            <Input id="telNoIndia" name="telNoIndia" disabled={isPending} />
            {fieldErrors['telNoIndia'] ? (
              <p className="text-danger text-xs">{fieldErrors['telNoIndia']}</p>
            ) : null}
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
            disabled={isPending}
            className="border-border text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-accent/20 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {fieldErrors['addressIndia'] ? (
            <p className="text-danger text-xs">{fieldErrors['addressIndia']}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <p className="text-text-secondary text-sm font-medium">Family residing in Oman?</p>
          <div className="border-border flex items-center gap-6 rounded-lg border px-3 py-2">
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

        <div className="border-border space-y-4 rounded-lg border p-4">
          {familyRows.length === 0 ? (
            <p className="text-text-secondary text-sm">No family members added.</p>
          ) : null}

          {familyRows.map((row, index) => (
            <div key={row.id} className="grid gap-4 md:grid-cols-3">
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
                {fieldErrors[`familyMembers.${index}.name`] ? (
                  <p className="text-danger text-xs">
                    {fieldErrors[`familyMembers.${index}.name`]}
                  </p>
                ) : null}
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
                  className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFamilyRow}
              disabled={isPending || familyRows.length === 0}
              aria-label="Remove family member row"
            >
              <UserMinus />
              Remove Row
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
            <Input id="shakhaIndia" name="shakhaIndia" disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="union">
              Union
            </label>
            <Input id="union" name="union" disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="district">
              District
            </label>
            <select
              id="district"
              name="district"
              disabled={isPending}
              className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              defaultValue=""
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
              Shakha
            </label>
            <select
              id="officeShakhaId"
              name="officeShakhaId"
              defaultValue=""
              disabled={isPending}
              className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            >
              <option value="">Select shakha</option>
              {shakhaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="submittedBy">
              Submitted By *
            </label>
            <Input id="submittedBy" name="submittedBy" disabled={isPending} />
            {fieldErrors['submittedBy'] ? (
              <p className="text-danger text-xs">{fieldErrors['submittedBy']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="receivedOn">
              Received On *
            </label>
            <Input id="receivedOn" name="receivedOn" type="date" disabled={isPending} />
            {fieldErrors['receivedOn'] ? (
              <p className="text-danger text-xs">{fieldErrors['receivedOn']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="approvedBy">
              Approved By *
            </label>
            <Input id="approvedBy" name="approvedBy" disabled={isPending} />
            {fieldErrors['approvedBy'] ? (
              <p className="text-danger text-xs">{fieldErrors['approvedBy']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="checkedBy">
              Checked By *
            </label>
            <Input id="checkedBy" name="checkedBy" disabled={isPending} />
            {fieldErrors['checkedBy'] ? (
              <p className="text-danger text-xs">{fieldErrors['checkedBy']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="expiry">
              Expiry *
            </label>
            <Input
              id="expiry"
              name="expiry"
              type="date"
              defaultValue={defaultExpiry}
              disabled={isPending}
            />
            {fieldErrors['expiry'] ? (
              <p className="text-danger text-xs">{fieldErrors['expiry']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="applicationNo">
              Application No *
            </label>
            <Input id="applicationNo" name="applicationNo" disabled={isPending} />
            {fieldErrors['applicationNo'] ? (
              <p className="text-danger text-xs">{fieldErrors['applicationNo']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="secretary">
              Secretary
            </label>
            <Input id="secretary" name="secretary" disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="president">
              President
            </label>
            <Input id="president" name="president" disabled={isPending} />
          </div>
        </div>
      </fieldset>

      {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/members')}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Member'}
        </Button>
      </div>
    </form>
  );
}
