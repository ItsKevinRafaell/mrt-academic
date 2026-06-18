-- Fix grades table - handle existing composite primary key
-- First, check if id column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grades' AND column_name='id') THEN
        -- Drop existing composite primary key if it exists
        ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_pkey;
        -- Add id column as new primary key
        ALTER TABLE grades ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
END $$;

-- Add timestamps if they don't exist
ALTER TABLE grades ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
