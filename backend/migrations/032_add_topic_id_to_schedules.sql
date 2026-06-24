-- Migration 032: Add topic_id to schedules (session deprecation)
-- Purpose: Connect schedules directly to topics since sessions are removed from UI

-- Step 1: Add topic_id column
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL;

-- Step 2: Migrate existing session_id → topic_id via sessions.topic_id FK
UPDATE schedules SET topic_id = s.topic_id
FROM sessions s
WHERE schedules.session_id = s.id AND schedules.topic_id IS NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_schedules_topic_id ON schedules(topic_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(day_of_week, start_time, end_time);
