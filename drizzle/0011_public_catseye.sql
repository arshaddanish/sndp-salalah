ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "first_joined_at" date;

UPDATE "members"
SET "active_from" = "created_at"::date
WHERE "active_from" IS NULL;

UPDATE "members"
SET "first_joined_at" = LEAST("active_from", "created_at"::date)
WHERE "first_joined_at" IS NULL;