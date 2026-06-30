-- Migration: 036_add_performance_indexes.sql
-- Description: Add missing indexes for query performance
-- Created: 2026-06-29

-- Index on tasks.course_id for filtering tasks by course
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON tasks(course_id);

-- Index on materials.session_id for materials lookup by session
CREATE INDEX IF NOT EXISTS idx_materials_session_id ON materials(session_id);

-- Index on task_progress.user_id for dashboard and progress queries
CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON task_progress(user_id);

-- Index on academic_events.event_date for upcoming events queries
CREATE INDEX IF NOT EXISTS idx_academic_events_event_date ON academic_events(event_date);

-- Composite index on grades(user_id, course_id) for grade lookups
CREATE INDEX IF NOT EXISTS idx_grades_user_course ON grades(user_id, course_id);

-- Index on sessions.course_id for session listing by course
CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id);
