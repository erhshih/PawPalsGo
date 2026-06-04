-- Enable PostGIS extension (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add Gender enum (safe if already exists)
DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to User table (IF NOT EXISTS = safe on existing DBs)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender"      "Gender";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio"         TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "interests"   TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "education"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zodiac"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "jobTitle"    TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company"     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "school"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city"        TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "height"      INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location"    geography(Point, 4326);

-- Add missing columns to Wallet table
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "balance" INTEGER NOT NULL DEFAULT 0;

-- Add missing columns to Meeting table
ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "escrow" INTEGER NOT NULL DEFAULT 0;

-- Add missing columns to Message table
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "text" TEXT NOT NULL DEFAULT '';

-- Add readAt columns
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "userAReadAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "userBReadAt" TIMESTAMP(3);
