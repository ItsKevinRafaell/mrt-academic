-- Migration 030: Cleanup Ghost Courses & Add FK Constraints
-- Purpose: Remove orphaned grades referencing non-existent courses,
--          and add FK constraints to prevent future ghosts

-- Step 1: Delete grades that reference courses that no longer exist
DELETE FROM grades WHERE course_id NOT IN (SELECT id FROM courses);

-- Step 2: Delete grade_components that reference courses that no longer exist
DELETE FROM grade_components WHERE course_id NOT IN (SELECT id FROM courses);

-- Step 3: Add FK constraint on grades.course_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_grades_course'
  ) THEN
    ALTER TABLE grades ADD CONSTRAINT fk_grades_course
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Add FK constraint on grade_components.course_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_grade_components_course'
  ) THEN
    ALTER TABLE grade_components ADD CONSTRAINT fk_grade_components_course
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;
END $$;
