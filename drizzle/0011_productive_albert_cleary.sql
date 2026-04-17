ALTER TABLE "members" ADD COLUMN "first_joined_at" date;

-- Backfill legacy rows so NULL doesn't break new-vs-renewal classification
UPDATE "members"
SET "first_joined_at" = COALESCE("active_from", "created_at"::date)
WHERE "first_joined_at" IS NULL;

-- Enforce NOT NULL now that all rows are backfilled
ALTER TABLE "members" ALTER COLUMN "first_joined_at" SET NOT NULL;