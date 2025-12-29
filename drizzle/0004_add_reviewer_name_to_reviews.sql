-- Add reviewer_name column to reviews table
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewer_name" text;

-- Make user_id nullable (remove NOT NULL constraint)
ALTER TABLE "reviews" ALTER COLUMN "user_id" DROP NOT NULL;

