ALTER TABLE "users" ADD COLUMN "display_username" text;

-- Seed the admin user if not exists
INSERT INTO "users" ("id", "name", "email", "email_verified", "created_at", "updated_at", "username", "display_username", "role")
VALUES (
  'user_admin_seed_001', 
  'SNDP Salalah Admin', 
  'admin@sndp-salalah.org', 
  true, 
  NOW(), 
  NOW(), 
  'salalahsndp', 
  'salalahsndp',
  'admin'
)
ON CONFLICT ("email") DO NOTHING;

-- Seed the corresponding account with the verified Better Auth hash
INSERT INTO "accounts" ("id", "account_id", "provider_id", "user_id", "password", "created_at", "updated_at")
SELECT 
  'account_admin_seed_001', 
  'admin_user_seed_001', 
  'credential', 
  "id", 
  '4883468d1f6882f3dce1eee409d10614:d5f006c863a802d89f798c488ef88ef0e76c041d70a5e9855f46e962dfb274b4ed6083348ccd9f1b1176f333341d25928ebfeb8bc865a6fcdf5bf621c5ab3431', 
  NOW(), 
  NOW()
FROM "users"
WHERE "email" = 'admin@sndp-salalah.org'
ON CONFLICT ("id") DO NOTHING;