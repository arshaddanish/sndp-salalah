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
