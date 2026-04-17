ALTER TABLE "members" ADD COLUMN "first_joined_at" date;

UPDATE "members"
SET "first_joined_at" = COALESCE("active_from", "created_at"::date)
WHERE "first_joined_at" IS NULL;

ALTER TABLE "members" ALTER COLUMN "first_joined_at" SET DEFAULT CURRENT_DATE;

ALTER TABLE "members" ALTER COLUMN "first_joined_at" SET NOT NULL;