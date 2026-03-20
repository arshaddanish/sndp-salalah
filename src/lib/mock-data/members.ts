// This file contains mock data and types for members, used for testing and development purposes.

export type MemberStatus = 'active' | 'expired' | 'lifetime' | 'near-expiry';

export type Member = {
  id: string;
  member_code: number;
  civil_id_no: string;
  name: string;
  dob: Date | null;
  family_status: string | null; // Marital Status
  email: string | null;
  photo_key: string | null;
  gsm_no: string | null;
  whatsapp_no: string | null;
  blood_group: string | null;
  profession: string | null;
  shakha_id: string;
  expiry: Date | null;
  created_at: Date;
};

export const getMemberStatus = (expiry: Date | null): MemberStatus => {
  if (!expiry) return 'lifetime';
  const today = new Date();
  if (expiry < today) return 'expired';

  // Calculate if expiring within 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (expiry <= thirtyDaysFromNow) return 'near-expiry';

  return 'active';
};

const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);

const pastYear = new Date();
pastYear.setFullYear(pastYear.getFullYear() - 1);

const monthsAgo = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d;
};

const monthsAhead = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d;
};

const getMockExpiry = (index: number) => {
  if (index % 15 === 0) {
    if (index % 2 === 0) {
      return monthsAhead(0);
    }

    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d;
  }

  if (index % 10 === 0) {
    return null;
  }

  if (index % 2 === 0) {
    return monthsAhead((index % 12) + 1);
  }

  return monthsAgo(index % 12);
};

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'm1',
    member_code: 1001,
    civil_id_no: '12345678',
    name: 'Mohammed Al-Rashidi',
    dob: new Date('1980-05-15'),
    email: 'mohammed@example.com',
    photo_key: null,
    gsm_no: '98765432',
    whatsapp_no: '98765432',
    blood_group: 'O+',
    profession: 'Engineer',
    shakha_id: '1',
    family_status: 'Married',
    expiry: nextYear,
    created_at: new Date('2020-01-01'),
  },
  {
    id: 'm2',
    member_code: 1002,
    civil_id_no: '87654321',
    name: 'Rahul Nair',
    dob: new Date('1985-08-22'),
    email: 'rahul@example.com',
    photo_key: null,
    gsm_no: '91234567',
    whatsapp_no: '91234567',
    blood_group: 'B+',
    profession: 'Doctor',
    shakha_id: '2',
    family_status: 'Married',
    expiry: pastYear,
    created_at: new Date('2019-05-12'),
  },
  {
    id: 'm3',
    member_code: 1003,
    civil_id_no: '11223344',
    name: 'Rajesh Kumar',
    dob: new Date('1975-11-30'),
    email: 'rajesh@example.com',
    photo_key: null,
    gsm_no: '99887766',
    whatsapp_no: '99887766',
    blood_group: 'A-',
    profession: 'Businessman',
    shakha_id: '1',
    family_status: 'Single',
    expiry: null, // Lifetime
    created_at: new Date('2015-08-20'),
  },
  // Adding more members...
  ...Array.from({ length: 97 }).map((_, i) => {
    const id = i + 4;
    const names = [
      'Anil Kumar',
      'Suresh Gopi',
      'Vinod K.',
      'Sunil Das',
      'Prakash Raj',
      'Manish Sharma',
      'Arjun V.',
      'Deepak Nair',
      'Kiran Kumar',
      'Sajan P.',
      'Ramesh Chennithala',
      'Oommen Chandy',
      'Pinarayi Vijayan',
      'V.S. Achuthanandan',
      'A.K. Antony',
      'K. Karunakaran',
      'E.K. Nayanar',
      'C.H. Mohammed Koya',
      'K.R. Gouri Amma',
      'T.M. Jacob',
      'R. Balakrishna Pillai',
      'P.J. Joseph',
      'K.M. Mani',
      'P.K. Kunhalikutty',
      'E. Ahamed',
      'M.K. Muneer',
      'Jose K. Mani',
    ];
    const professions = [
      'Driver',
      'Salesman',
      'Accountant',
      'Manager',
      'Clerk',
      'Supervisor',
      'Technician',
    ];
    const familyStatuses = ['Married', 'Single', 'Divorced'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

    return {
      id: `m${id}`,
      member_code: 1000 + id,
      civil_id_no: (20000000 + id).toString(),
      name:
        names[i % names.length] +
        (i > names.length ? ` ${String.fromCharCode(65 + (i % 26))}` : ''),
      dob: new Date(1970 + (i % 30), i % 12, (i % 28) + 1),
      email: `member${id}@example.com`,
      photo_key: null,
      gsm_no: (90000000 + id).toString(),
      whatsapp_no: (90000000 + id).toString(),
      blood_group: bloodGroups[i % bloodGroups.length] || 'O+',
      profession: professions[i % professions.length] || 'Technician',
      shakha_id: ((i % 5) + 1).toString(),
      family_status: familyStatuses[i % familyStatuses.length] || 'Single',
      expiry: getMockExpiry(i),
      created_at: new Date(2020, 0, 1),
    };
  }),
];
