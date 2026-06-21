-- Migration 007: Add Topics system and refactor Materials
-- This migration introduces topic-based organization for sessions and materials
-- allowing multiple sessions to share the same materials under a topic

BEGIN;

-- Step 1: Create topics table
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Create indexes for topics
CREATE INDEX idx_topics_course_id ON topics(course_id);
CREATE INDEX idx_topics_order ON topics(course_id, order_number);

-- Step 2: Add topic_id to sessions table (nullable initially)
ALTER TABLE sessions ADD COLUMN topic_id INTEGER;
ALTER TABLE sessions ADD CONSTRAINT sessions_topic_id_fkey
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL;

-- Create index for sessions.topic_id
CREATE INDEX idx_sessions_topic_id ON sessions(topic_id);

-- Step 3: Add topic_id to materials table (keep session_id temporarily)
ALTER TABLE materials ADD COLUMN topic_id INTEGER;
ALTER TABLE materials ADD CONSTRAINT materials_topic_id_fkey
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;

-- Create index for materials.topic_id
CREATE INDEX idx_materials_topic_id ON materials(topic_id);

-- Step 4: Data migration - Create topics from existing sessions and migrate materials
-- 4.1: Create a topic for each session that has materials
DO $$
DECLARE
    session_rec RECORD;
    new_topic_id INTEGER;
BEGIN
    -- Create topics for sessions that have materials
    FOR session_rec IN
        SELECT DISTINCT s.id, s.course_id, s.title, s.number, s.description
        FROM sessions s
        INNER JOIN materials m ON m.session_id = s.id
        ORDER BY s.course_id, s.number
    LOOP
        -- Insert new topic with session title as topic title
        INSERT INTO topics (course_id, title, description, order_number, created_at, updated_at)
        VALUES (
            session_rec.course_id,
            session_rec.title,
            session_rec.description,
            session_rec.number,
            NOW(),
            NOW()
        )
        RETURNING id INTO new_topic_id;

        -- Link the session to the new topic
        UPDATE sessions SET topic_id = new_topic_id WHERE id = session_rec.id;

        -- Move materials from session to topic
        UPDATE materials SET topic_id = new_topic_id WHERE session_id = session_rec.id;
    END LOOP;
END $$;

-- Step 5: Make session_id nullable in materials (we'll keep both for now)
ALTER TABLE materials ALTER COLUMN session_id DROP NOT NULL;

-- Step 6: Add unique constraint for topics (course_id, title)
ALTER TABLE topics ADD CONSTRAINT topics_course_title_unique UNIQUE (course_id, title);

-- Step 7: Update materials type check constraint to include more types
ALTER TABLE materials DROP CONSTRAINT materials_type_check;
ALTER TABLE materials ADD CONSTRAINT materials_type_check
    CHECK (type::text = ANY (ARRAY[
        'pdf'::character varying,
        'link'::character varying,
        'video'::character varying,
        'image'::character varying,
        'doc'::character varying,
        'ppt'::character varying,
        'zip'::character varying
    ]::text[]));

-- Step 8: Add updated_at trigger functions if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify migration
DO $$
DECLARE
    topic_count INTEGER;
    material_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO topic_count FROM topics;
    SELECT COUNT(*) INTO material_count FROM materials WHERE topic_id IS NOT NULL;

    RAISE NOTICE 'Migration completed: % topics created, % materials migrated to topics',
                 topic_count, material_count;
END $$;

COMMIT;
