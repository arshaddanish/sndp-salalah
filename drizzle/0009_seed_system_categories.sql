INSERT INTO "transaction_categories" ("id", "name", "type", "is_system")
VALUES ('system-membership-fee', 'Membership Fee', 'income', true)
ON CONFLICT (lower("name")) DO NOTHING;