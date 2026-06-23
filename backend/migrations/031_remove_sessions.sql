-- Migration 031: Remove Sessions UI Layer (DB schema already supports topic_id)
-- Purpose: Materials and board_gallery already have topic_id columns.
-- This migration is a no-op for schema — the frontend will now fetch by topic_id directly.
-- Sessions table kept for backward compatibility with topic management dialog.

-- Materials already have topic_id FK (see \d+ materials output)
-- Board gallery already has topic_id FK (see \d+ board_gallery output)
-- No schema changes needed — frontend just switches from session_id to topic_id

SELECT 'Migration 031: No schema changes needed — frontend switches to topic_id' AS info;
