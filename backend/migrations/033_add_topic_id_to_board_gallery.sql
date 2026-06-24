-- Migration 033: Add topic_id to board_gallery (session deprecation)
-- Purpose: Allow board gallery items to be created directly for a topic.
--          The FAB QuickPhoto uses topic_id instead of session_id.

-- Step 1: Add topic_id column (nullable, references topics)
ALTER TABLE board_gallery ADD COLUMN IF NOT EXISTS topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL;

-- Step 2: Make session_id nullable (existing items keep their session_id)
ALTER TABLE board_gallery ALTER COLUMN session_id DROP NOT NULL;

-- Step 3: Backfill topic_id from existing session_id -> sessions.topic_id
UPDATE board_gallery bg
SET topic_id = s.topic_id
FROM sessions s
WHERE bg.session_id = s.id AND bg.topic_id IS NULL;

-- Step 4: Ensure every item still belongs to either a topic or session
ALTER TABLE board_gallery ADD CONSTRAINT board_gallery_must_belong
    CHECK (topic_id IS NOT NULL OR session_id IS NOT NULL);

-- Step 5: Index for performance
CREATE INDEX IF NOT EXISTS idx_board_gallery_topic_id ON board_gallery(topic_id);

-- Note: To fill missing topic_id in schedules, run:
-- SELECT id, course_id FROM schedules WHERE topic_id IS NULL;
-- UPDATE schedules SET topic_id = <topic_id> WHERE id = <schedule_id>;
