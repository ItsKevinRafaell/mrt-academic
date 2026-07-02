-- Migration: 039_presentation_pending.sql
-- Description: Add pending presentations table for kurikulum approval workflow
-- Created: 2026-06-30

-- Pending presentation requests (before kurikulum approval)
CREATE TABLE IF NOT EXISTS presentation_pending (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255),
    points INTEGER DEFAULT 1,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    UNIQUE(course_id, user_id, requested_at)
);

-- Add approved columns to existing presentation_records
ALTER TABLE presentation_records
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pending_course ON presentation_pending(course_id);
CREATE INDEX IF NOT EXISTS idx_pending_status ON presentation_pending(status);
