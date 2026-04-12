ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_transaction_code_unique" ON "transactions" USING btree ("transaction_code");--> statement-breakpoint
CREATE INDEX "transactions_remarks_trgm_idx" ON "transactions" USING gin (lower("remarks") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "transactions_transaction_code_trgm_idx" ON "transactions" USING gin (cast("transaction_code" as text) gin_trgm_ops);