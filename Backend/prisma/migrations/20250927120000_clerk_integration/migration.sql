-- Clerk integration migration
-- 1. Remove ANONYMOUS from Role enum (PostgreSQL requires enum alter sequence)
-- 2. Add clerkUserId column to User
-- NOTE: Adjust enum alteration syntax depending on DB. For PostgreSQL we cannot drop an enum value easily if in use.
-- Safer approach: create new enum, alter column, drop old enum.

-- Step 0: Ensure no users still have role 'ANONYMOUS'. If they do, map them to 'USER'.
UPDATE "User" SET role='USER' WHERE role='ANONYMOUS';

-- Step 1: Create new enum without ANONYMOUS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role_new') THEN
    CREATE TYPE "Role_new" AS ENUM ('ADMIN','USER');
  END IF;
END$$;

-- Step 2: Alter User.role to new enum
-- Drop default temporarily to avoid cast issue
ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE "User" ALTER COLUMN role TYPE "Role_new" USING role::text::"Role_new";
ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'USER';

-- Step 3: Drop old enum and rename new enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    DROP TYPE "Role";
  END IF;
END$$;
ALTER TYPE "Role_new" RENAME TO "Role";

-- Step 4: Add clerkUserId column (nullable unique)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT UNIQUE;
