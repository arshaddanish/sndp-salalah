CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "members_name_trgm_idx" ON "members" USING gin (lower("name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "members_email_trgm_idx" ON "members" USING gin (lower("email") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "members_whatsapp_no_trgm_idx" ON "members" USING gin (lower("whatsapp_no") gin_trgm_ops);