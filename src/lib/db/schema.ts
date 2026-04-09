import { createId } from '@paralleldrive/cuid2';
import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';

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
  (table) => [uniqueIndex('transaction_categories_name_unique').on(table.name)],
);
