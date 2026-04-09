import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { index } from 'drizzle-orm/pg-core';

import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const shakhas = pgTable(
  'shakhas',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text('name').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    (table) => [uniqueIndex('transaction_categories_name_unique').on(sql`lower(${table.name})`)],
    index('transaction_categories_name_trgm_idx').using(
      'gin',
      sql`lower(${table.name}) gin_trgm_ops`,
    ),
  ],
);

export const transactionCategories = pgTable(
  'transaction_categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text('name').notNull(),
    description: text('description'),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    is_system: boolean('is_system').notNull().default(false),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('transaction_categories_name_unique').on(table.name)],
);

export const members = pgTable(
  'members',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    member_code: integer('member_code').notNull().generatedByDefaultAsIdentity({
      startWith: 1001,
      increment: 1,
    }),
    civil_id_no: text('civil_id_no').notNull(),
    name: text('name').notNull(),
    dob: date('dob', { mode: 'date' }),
    email: text('email'),
    photo_key: text('photo_key'),
    gsm_no: text('gsm_no'),
    whatsapp_no: text('whatsapp_no'),
    blood_group: text('blood_group'),
    profession: text('profession'),
    family_status: text('family_status'),
    residential_area: text('residential_area'),
    passport_no: text('passport_no'),
    address_india: text('address_india'),
    tel_no_india: text('tel_no_india'),
    is_family_in_oman: boolean('is_family_in_oman').notNull().default(false),
    application_no: text('application_no'),
    received_on: date('received_on', { mode: 'date' }),
    submitted_by: text('submitted_by'),
    shakha_india: text('shakha_india'),
    checked_by: text('checked_by'),
    approved_by: text('approved_by'),
    president: text('president'),
    secretary: text('secretary'),
    union: text('union'),
    district: text('district'),
    shakha_id: text('shakha_id')
      .notNull()
      .references(() => shakhas.id),
    is_archived: boolean('is_archived').notNull().default(false),
    archived_at: timestamp('archived_at', { mode: 'date' }),
    is_lifetime: boolean('is_lifetime').notNull().default(false),
    active_from: date('active_from', { mode: 'date' }),
    expiry: date('expiry', { mode: 'date' }),
    created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('members_member_code_unique').on(table.member_code),
    uniqueIndex('members_civil_id_no_unique').on(table.civil_id_no),
    index('members_shakha_id_idx').on(table.shakha_id),
    index('members_active_from_idx').on(table.active_from),
    index('members_expiry_idx').on(table.expiry),
    index('members_name_trgm_idx').using('gin', sql`lower(${table.name}) gin_trgm_ops`),
    index('members_email_trgm_idx').using('gin', sql`lower(${table.email}) gin_trgm_ops`),
    index('members_whatsapp_no_trgm_idx').using(
      'gin',
      sql`lower(${table.whatsapp_no}) gin_trgm_ops`,
    ),
  ],
);

export const family_members = pgTable(
  'family_members',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    member_id: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    relation: text('relation'),
    dob: date('dob', { mode: 'date' }),
    created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('family_members_member_id_idx').on(table.member_id)],
);
