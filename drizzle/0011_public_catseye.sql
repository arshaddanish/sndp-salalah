ALTER TABLE "members" ADD COLUMN "first_joined_at" date;
UPDATE "members" SET "first_joined_at" = COALESCE("active_from", "created_at"::date) WHERE "first_joined_at" IS NULL;