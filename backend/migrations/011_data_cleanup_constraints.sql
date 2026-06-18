-- Data cleanup and stricter constraints
-- Ensure data integrity after schema migrations

-- Ensure materials always belong to either a topic or session
ALTER TABLE materials ADD CONSTRAINT materials_must_belong
    CHECK (topic_id IS NOT NULL OR session_id IS NOT NULL);

-- Make sessions require topic_id (after cleanup)
-- Note: Run data cleanup script before enabling this constraint
-- ALTER TABLE sessions ALTER COLUMN topic_id SET NOT NULL;

-- Remove orphaned materials (no topic_id and no session_id)
DELETE FROM materials
WHERE topic_id IS NULL AND session_id IS NULL;

-- Remove orphaned sessions (no topic_id) - optional, comment out if not needed
-- DELETE FROM sessions WHERE topic_id IS NULL;
