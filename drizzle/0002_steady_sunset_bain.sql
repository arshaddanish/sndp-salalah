ALTER TABLE "transaction_categories" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;