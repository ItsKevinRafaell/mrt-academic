-- Migration: 038_presentation_system.sql
-- Description: Add presentation rotation system tables
-- Created: 2026-06-30

-- Course presentation configuration
CREATE TABLE IF NOT EXISTS course_presentation_config (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL DEFAULT 'nomor_urut' CHECK (mode IN ('nomor_urut', 'prioritas')),
    priority_limit INTEGER DEFAULT 5,
    next_nomor_urut INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id)
);

-- Priority students list per course
CREATE TABLE IF NOT EXISTS course_priority_students (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    priority_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- Presentation records with points
CREATE TABLE IF NOT EXISTS presentation_records (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    presented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    topic VARCHAR(255),
    points INTEGER DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_presentation_config_course ON course_presentation_config(course_id);
CREATE INDEX IF NOT EXISTS idx_priority_students_course ON course_priority_students(course_id);
CREATE INDEX IF NOT EXISTS idx_priority_students_user ON course_priority_students(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_records_course ON presentation_records(course_id);
CREATE INDEX IF NOT EXISTS idx_presentation_records_user ON presentation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_records_date ON presentation_records(presented_at);
