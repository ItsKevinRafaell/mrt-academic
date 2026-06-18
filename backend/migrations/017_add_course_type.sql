-- Migration: Add course_type column to courses table
-- Purpose: Add course type tags (lecturer/lab) to distinguish course types

-- Add course_type column with default value
ALTER TABLE courses
ADD COLUMN course_type VARCHAR(50) DEFAULT 'lecturer';

-- Update existing courses to have 'lecturer' type
UPDATE courses SET course_type = 'lecturer' WHERE course_type IS NULL;

-- Add index for faster filtering
CREATE INDEX idx_courses_course_type ON courses(course_type);
