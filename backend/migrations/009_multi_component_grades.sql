-- Multi-component grade system
-- Support for UAP, UAC, UTC, Lab, Lecture with custom weights per course

CREATE TABLE IF NOT EXISTS grade_components (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g., "UAP", "UAC", "UTC", "Lab", "Lecture"
    weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100), -- percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, name)
);

-- Add component_id to grades table (nullable for backward compatibility)
ALTER TABLE grades ADD COLUMN IF NOT EXISTS component_id INTEGER REFERENCES grade_components(id) ON DELETE CASCADE;

-- Add unique constraint for student + course + component
ALTER TABLE grades ADD CONSTRAINT unique_student_course_component
    UNIQUE(user_id, course_id, component_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grade_components_course_id ON grade_components(course_id);
CREATE INDEX IF NOT EXISTS idx_grades_component_id ON grades(component_id);
CREATE INDEX IF NOT EXISTS idx_grades_user_course_component ON grades(user_id, course_id, component_id);
