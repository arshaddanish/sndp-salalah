CREATE TABLE "transaction_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "shakhas_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_categories_name_unique" ON "transaction_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "transaction_categories_name_trgm_idx" ON "shakhas" USING gin (lower("name") gin_trgm_ops);