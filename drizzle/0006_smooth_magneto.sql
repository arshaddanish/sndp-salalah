CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_code" integer NOT NULL,
	"transaction_date" date NOT NULL,
	"entry_kind" text NOT NULL,
	"category_id" text,
	"type" text,
	"payment_mode" text,
	"fund_account" text NOT NULL,
	"payee_merchant" text,
	"paid_receipt_by" text,
	"amount" text NOT NULL,
	"remarks" text DEFAULT '' NOT NULL,
	"attachment_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "transaction_categories_name_trgm_idx";--> statement-breakpoint
DROP INDEX "transaction_categories_name_unique";--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_transaction_date_idx" ON "transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "transactions_fund_account_idx" ON "transactions" USING btree ("fund_account");--> statement-breakpoint
CREATE INDEX "transactions_entry_kind_idx" ON "transactions" USING btree ("entry_kind");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_categories_name_unique" ON "transaction_categories" USING btree (lower("name"));