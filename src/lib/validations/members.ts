import { z } from 'zod';

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

const optionalText = () => z.string().trim().optional().or(z.literal(''));

const emailSchema = z.email();

const optionalTextMax = (label: string, max: number) =>
  z.string().trim().max(max, `${label} is too long`).optional().or(z.literal(''));

const isValidDateValue = (value: string) => !Number.isNaN(Date.parse(value));

const requiredDate = (label: string) =>
  requiredText(label).refine((value) => isValidDateValue(value), `${label} must be a valid date`);

const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || isValidDateValue(value), 'Date must be valid');

export const familyMemberInputSchema = z.object({
  name: requiredText('Family member name').max(120, 'Family member name is too long'),
  relation: optionalText(),
  dob: optionalDate,
});

export const createMemberSchema = z.object({
  name: requiredText('Name').max(150, 'Name is too long'),
  dob: requiredDate('DOB'),
  profession: requiredText('Profession').max(150, 'Profession is too long'),
  whatsappNo: requiredText('Whatsapp No').max(20, 'Whatsapp No is too long'),
  gsmNo: requiredText('GSM No').max(20, 'GSM No is too long'),
  familyStatus: optionalText(),
  bloodGroup: optionalText(),
  residentialArea: requiredText('Residential Area').max(150, 'Residential Area is too long'),
  civilIdNo: requiredText('Civil ID No').max(50, 'Civil ID No is too long'),
  passportNo: requiredText('Passport No').max(50, 'Passport No is too long'),
  email: optionalText().refine(
    (value) => !value || emailSchema.safeParse(value).success,
    'Email must be valid',
  ),
  telNoIndia: optionalTextMax('Telephone No(India)', 20),
  addressIndia: requiredText('Address In India').max(500, 'Address In India is too long'),
  isFamilyInOman: z.boolean(),
  familyMembers: z.array(familyMemberInputSchema),
  shakhaIndia: optionalText(),
  union: optionalText(),
  district: optionalText(),
  officeShakhaId: optionalText(),
  submittedBy: requiredText('Submitted By').max(120, 'Submitted By is too long'),
  approvedBy: requiredText('Approved By').max(120, 'Approved By is too long'),
  receivedOn: requiredDate('Received On'),
  checkedBy: requiredText('Checked By').max(120, 'Checked By is too long'),
  expiry: optionalDate,
  applicationNo: requiredText('Application No').max(50, 'Application No is too long'),
  secretary: optionalText(),
  president: optionalText(),
  photoKey: requiredText('Photo'),
});

export type FamilyMemberInput = z.infer<typeof familyMemberInputSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema;

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const renewMembershipSchema = z.object({
  memberId: requiredText('Member ID'),
  amount: z.number({ error: 'Amount must be a number' }).positive('Amount must be positive'),
  paymentMode: z.enum(['cash', 'bank', 'online_transaction', 'cheque'], {
    error: 'Payment mode is required',
  }),
  fundAccount: z.enum(['cash', 'bank'], {
    error: 'Fund account is required',
  }),
  newExpiry: requiredDate('New expiry date'),
  remarks: optionalTextMax('Remarks', 500),
  attachmentKey: optionalText(),
});

export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;
