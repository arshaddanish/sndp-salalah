DROP INDEX "transaction_categories_name_trgm_idx";--> statement-breakpoint
DROP INDEX "transaction_categories_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "shakhas_name_unique" ON "shakhas" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_categories_name_unique" ON "transaction_categories" USING btree (lower("name"));