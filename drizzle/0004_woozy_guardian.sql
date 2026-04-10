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
DROP INDEX IF EXISTS "transaction_categories_name_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_categories_name_unique" ON "transaction_categories" USING btree (lower("name"));