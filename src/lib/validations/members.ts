import { z } from 'zod';

export const MEMBER_PHOTO_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const;
export const MEMBER_PHOTO_DEFAULT_MAX_BYTES = 512 * 1024; // 512KB

import {
  optionalDate,
  optionalText,
  optionalTextMax,
  requiredDate,
  requiredText,
} from '@/lib/validations/common';

const emailSchema = z.email();

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
  unionName: optionalText(),
  district: optionalText(),
  officeShakhaId: requiredText('Office Shakha').max(120, 'Office Shakha is too long'),
  submittedBy: requiredText('Submitted By').max(120, 'Submitted By is too long'),
  approvedBy: requiredText('Approved By').max(120, 'Approved By is too long'),
  receivedOn: requiredDate('Received On'),
  checkedBy: requiredText('Checked By').max(120, 'Checked By is too long'),
  applicationNo: requiredText('Application No').max(50, 'Application No is too long'),
  secretary: optionalText(),
  president: optionalText(),
  photoKey: requiredText('Photo'),
});

export type FamilyMemberInput = z.infer<typeof familyMemberInputSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema.extend({
  photoKey: z.string().trim().optional().or(z.literal('')),
  expiry: optionalDate,
});

export const setMemberLifetimeSchema = z.object({
  memberId: requiredText('Member ID'),
  isLifetime: z.boolean(),
});

export type SetMemberLifetimeInput = z.infer<typeof setMemberLifetimeSchema>;

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

export const updateMemberPhotoSchema = z.object({
  memberId: requiredText('Member ID'),
  photoKey: requiredText('Photo').max(500, 'Photo key is too long'),
});

export type UpdateMemberPhotoInput = z.infer<typeof updateMemberPhotoSchema>;

export const createMemberPhotoUploadSchema = z.object({
  fileName: z.string().trim().min(1, 'File name is required').max(255, 'File name is too long'),
  fileSize: z
    .number()
    .int()
    .positive('File size must be greater than 0')
    .max(Number.MAX_SAFE_INTEGER),
  fileType: z.enum(MEMBER_PHOTO_ALLOWED_MIME_TYPES, {
    message: 'Only JPEG or PNG files are allowed.',
  }),
});

export type CreateMemberPhotoUploadInput = z.infer<typeof createMemberPhotoUploadSchema>;
