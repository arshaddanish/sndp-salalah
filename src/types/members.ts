import type { TransactionFundAccount, TransactionPaymentMode } from '@/types/transactions';

export type MemberStatus = 'active' | 'expired' | 'lifetime' | 'near-expiry';

export type MemberFamilyMember = {
  id: string;
  name: string;
  relation: string | null;
  dob: Date | null;
  created_at: Date;
};

export type Member = {
  id: string;
  member_code: number;
  civil_id_no: string;
  name: string;
  dob: Date | null;
  family_status: string | null;
  email: string | null;
  photo_key: string | null;
  gsm_no: string | null;
  whatsapp_no: string | null;
  blood_group: string | null;
  profession: string | null;
  shakha_id: string;
  residential_area?: string | null;
  passport_no?: string | null;
  address_india?: string | null;
  tel_no_india?: string | null;
  is_family_in_oman?: boolean;
  application_no?: string | null;
  received_on?: Date | null;
  submitted_by?: string | null;
  shakha_india?: string | null;
  checked_by?: string | null;
  approved_by?: string | null;
  president?: string | null;
  secretary?: string | null;
  union?: string | null;
  district?: string | null;
  family_members?: MemberFamilyMember[];
  expiry: Date | null;
  created_at: Date;
};

export type FamilyMemberInput = {
  name: string;
  relation?: string;
  dob?: string;
};

export type CreateMemberInput = {
  memberCodePreview: number;
  name: string;
  dob: string;
  profession: string;
  whatsappNo: string;
  gsmNo: string;
  familyStatus?: string;
  bloodGroup?: string;
  residentialArea: string;
  civilIdNo: string;
  passportNo: string;
  email?: string;
  telNoIndia?: string;
  addressIndia: string;
  isFamilyInOman: boolean;
  familyMembers: FamilyMemberInput[];
  shakhaIndia?: string;
  union?: string;
  district?: string;
  officeShakhaId?: string;
  submittedBy: string;
  approvedBy: string;
  receivedOn: string;
  checkedBy: string;
  expiry?: string;
  applicationNo: string;
  secretary?: string;
  president?: string;
  photoKey: string;
};

/** Extended member with resolved shakha name and computed status */
export type MemberDetail = Member & {
  shakhaName: string;
  status: MemberStatus;
  familyMembersList: MemberFamilyMember[];
};

/** A membership fee transaction linked to a member */
export type MemberTransaction = {
  id: string;
  transactionCode: number;
  transactionDate: Date;
  amount: string;
  paymentMode: TransactionPaymentMode;
  fundAccount: TransactionFundAccount;
  remarks: string;
  createdAt: Date;
};
