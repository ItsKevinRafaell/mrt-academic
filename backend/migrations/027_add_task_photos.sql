-- Migration: 027_add_task_photos.sql
-- Description: Add task_photos table for storing task attachments
-- Created: 2026-06-30

CREATE TABLE IF NOT EXISTS task_photos (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_photos_task_id ON task_photos(task_id);
CREATE INDEX IF NOT EXISTS idx_task_photos_created_by ON task_photos(created_by);
