-- Add type and max_score columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'assignment';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
