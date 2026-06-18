-- Migration: Fix grades unique constraint for multi-component system
-- Problem: grades_user_course_unique hanya mengizinkan 1 grade per (user_id, course_id)
-- Solution: Hapus constraint lama, gunakan unique_student_course_component yang sudah ada

-- Drop constraint lama yang conflict
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_user_course_unique;

-- Pastikan constraint baru ada (unique per user_id, course_id, component_id)
-- Note: Migration 009 sudah membuat unique_student_course_component, tapi kita pastikan di sini
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_student_course_component'
    ) THEN
        ALTER TABLE grades
        ADD CONSTRAINT unique_student_course_component
        UNIQUE (user_id, course_id, component_id);
    END IF;
END $$;

-- Make component_id NOT NULL (required for multi-component system)
-- First, delete old single-grade entries that don't have component_id
DELETE FROM grades WHERE component_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE grades ALTER COLUMN component_id SET NOT NULL;
