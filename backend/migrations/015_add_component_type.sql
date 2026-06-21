-- Add type column to grade_components
ALTER TABLE grade_components ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'lecture';

-- Add comment for documentation
COMMENT ON COLUMN grade_components.type IS 'Type of component: lecture, lab, or other';
