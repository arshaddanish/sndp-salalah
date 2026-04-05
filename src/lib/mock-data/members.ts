// This file contains mock member data and helper utilities used for testing and development.

import type { Member, MemberStatus } from '@/types/members';

export const getMemberStatus = (expiry: Date | null, isLifetime: boolean): MemberStatus => {
  if (isLifetime) return 'lifetime';
  if (!expiry) return 'pending';

  // Normalize today to start-of-day for day-granularity comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clone and normalize expiry to start-of-day to avoid mutating caller-provided Date
  const normalizedExpiry = new Date(expiry);
  normalizedExpiry.setHours(0, 0, 0, 0);

  if (normalizedExpiry < today) return 'expired';

  // Calculate if expiring within 30 days
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (normalizedExpiry <= thirtyDaysFromNow) return 'near-expiry';

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
    name: 'Suresh Nair',
    dob: new Date('1980-05-15'),
    email: 'suresh.nair@example.com',
    photo_key: null,
    gsm_no: '98765432',
    whatsapp_no: '98765432',
    blood_group: 'O+',
    profession: 'Engineer',
    shakha_id: '1',
    family_status: 'Married',
    residential_area: 'Salalah East',
    passport_no: 'N1234567',
    address_india: 'House 21, Temple Road, Alappuzha, Kerala',
    tel_no_india: '0477-2233445',
    is_family_in_oman: true,
    application_no: 'APP-1001',
    received_on: new Date('2019-12-20'),
    submitted_by: 'Harish Menon',
    shakha_india: 'Karunagappally',
    checked_by: 'Anil Kumar',
    approved_by: 'R. Madhavan',
    president: 'Pradeep Kumar',
    secretary: 'Girish Nair',
    union: 'Kollam Union',
    district: 'Kollam',
    family_members: [
      {
        id: 'm1-f1',
        name: 'Lakshmi Suresh',
        relation: 'Spouse',
        dob: new Date('1984-07-09'),
        created_at: new Date('2020-01-01'),
      },
      {
        id: 'm1-f2',
        name: 'Aditya Suresh',
        relation: 'Son',
        dob: new Date('2011-03-14'),
        created_at: new Date('2020-01-01'),
      },
    ],
    is_archived: false,
    archived_at: null,
    is_lifetime: false,
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
    is_archived: false,
    archived_at: null,
    is_lifetime: false,
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
    is_archived: false,
    archived_at: null,
    is_lifetime: true,
    expiry: null,
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
      'Ramesh Babu',
      'Harikrishnan Nair',
      'Pinarayan Iyer',
      'Sankaran Acharya',
      'Arvind Menon',
      'Krishnakumar Pillai',
      'Nandakumar Das',
      'Maheshwar Rao',
      'K.R. Gouri Amma',
      'T.M. Janardhanan',
      'R. Balakrishnan Pillai',
      'P.J. Jayakumar',
      'K.M. Mani',
      'P.K. Krishnakutty',
      'E. Anandan',
      'M.K. Madhavan',
      'Jayan K. Mani',
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
        (i > names.length ? ` ${String.fromCodePoint(65 + (i % 26))}` : ''),
      dob: new Date(1970 + (i % 30), i % 12, (i % 28) + 1),
      email: `member${id}@example.com`,
      photo_key: null,
      gsm_no: (90000000 + id).toString(),
      whatsapp_no: (90000000 + id).toString(),
      blood_group: bloodGroups[i % bloodGroups.length] || 'O+',
      profession: professions[i % professions.length] || 'Technician',
      shakha_id: ((i % 5) + 1).toString(),
      family_status: familyStatuses[i % familyStatuses.length] || 'Single',
      is_archived: false,
      archived_at: null,
      is_lifetime: false,
      expiry: getMockExpiry(i),
      created_at: new Date(2020, 0, 1),
    };
  }),
];
