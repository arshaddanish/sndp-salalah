import { createId } from '@paralleldrive/cuid2';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
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
  (table) => [uniqueIndex('shakhas_name_unique').on(table.name)],
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
  (table) => [uniqueIndex('transaction_categories_name_unique').on(sql`lower(${table.name})`)],
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
    union_name: text('union_name'),
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
export const transactions = pgTable(
  'transactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    transaction_code: integer('transaction_code').notNull(),
    transaction_date: date('transaction_date', { mode: 'date' }).notNull(),
    entry_kind: text('entry_kind', { enum: ['regular', 'opening_balance'] }).notNull(),
    category_id: text('category_id').references(() => transactionCategories.id),
    type: text('type', { enum: ['income', 'expense'] }),
    payment_mode: text('payment_mode', { enum: ['cash', 'bank', 'online_transaction', 'cheque'] }),
    fund_account: text('fund_account', { enum: ['cash', 'bank'] }).notNull(),
    payee_merchant: text('payee_merchant'),
    paid_receipt_by: text('paid_receipt_by'),
    member_id: text('member_id').references(() => members.id),
    amount: numeric('amount', { precision: 10, scale: 3 }).notNull(),
    remarks: text('remarks').notNull().default(''),
    attachment_key: text('attachment_key'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('transactions_transaction_code_unique').on(table.transaction_code),
    index('transactions_transaction_date_idx').on(table.transaction_date),
    index('transactions_fund_account_idx').on(table.fund_account),
    index('transactions_entry_kind_idx').on(table.entry_kind),
    index('transactions_category_id_idx').on(table.category_id),
    index('transactions_member_id_idx').on(table.member_id),
    index('transactions_remarks_trgm_idx').using('gin', sql`lower(${table.remarks}) gin_trgm_ops`),
    index('transactions_transaction_code_trgm_idx').using(
      'gin',
      sql`cast(${table.transaction_code} as text) gin_trgm_ops`,
    ),
  ],
);
// ─── Drizzle Relations ───────────────────────────────────────────────────────

export const membersRelations = relations(members, ({ one, many }) => ({
  shakha: one(shakhas, {
    fields: [members.shakha_id],
    references: [shakhas.id],
  }),
  family_members: many(family_members),
}));

export const shakhasRelations = relations(shakhas, ({ many }) => ({
  members: many(members),
}));

export const familyMembersRelations = relations(family_members, ({ one }) => ({
  member: one(members, {
    fields: [family_members.member_id],
    references: [members.id],
  }),
}));
export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(transactionCategories, {
    fields: [transactions.category_id],
    references: [transactionCategories.id],
  }),
}));
