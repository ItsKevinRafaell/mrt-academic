-- Migration: Schema revisions for frontend integration
-- 1. Add cawu_id to courses table
-- 2. Add submission_link to tasks table
-- 3. Expand materials type enum to include ppt, doc, youtube

-- 1. Add cawu_id to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cawu_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_courses_cawu_id ON courses(cawu_id);

-- 2. Add submission_link to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submission_link TEXT;

-- 3. Drop existing constraint and recreate with expanded types
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_type_check;
ALTER TABLE materials ADD CONSTRAINT materials_type_check
    CHECK (type IN ('pdf', 'link', 'video', 'image', 'ppt', 'doc', 'youtube'));
