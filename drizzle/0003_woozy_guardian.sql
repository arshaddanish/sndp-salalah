ALTER TABLE "transaction_categories" ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'expense';
--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD COLUMN IF NOT EXISTS "is_system" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "transaction_categories_name_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_categories_name_unique" ON "transaction_categories" USING btree (lower("name"));