import type { TransactionFundAccount, TransactionPaymentMode } from '@/types/transactions';

export type { CreateMemberInput, FamilyMemberInput } from '@/lib/validations/members';

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
  is_archived: boolean;
  archived_at: Date | null;
  is_lifetime: boolean;
  active_from: Date | null;
  expiry: Date | null;
  created_at: Date;
};

/** Extended member with resolved shakha name and computed status */
export type MemberDetail = Member & {
  shakhaName: string;
  status: MemberStatus;
  familyMembersList: MemberFamilyMember[];
};

export type MemberFamilyMember = {
  id: string;
  name: string;
  relation: string | null;
  dob: Date | null;
  created_at: Date;
};

export type MemberStatus = 'active' | 'expired' | 'lifetime' | 'near-expiry' | 'pending';

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
