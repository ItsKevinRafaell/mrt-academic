-- Migration for Live Board Gallery
-- Stores board items (photos of whiteboard/notes) for each session

CREATE TABLE IF NOT EXISTS board_gallery (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    ocr_text TEXT,
    tags TEXT[] DEFAULT '{}',
    order_number INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_board_gallery_session_id ON board_gallery(session_id);
CREATE INDEX IF NOT EXISTS idx_board_gallery_uploaded_by ON board_gallery(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_board_gallery_active ON board_gallery(is_active);
CREATE INDEX IF NOT EXISTS idx_board_gallery_order ON board_gallery(session_id, order_number);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_board_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_board_gallery_updated_at
    BEFORE UPDATE ON board_gallery
    FOR EACH ROW
    EXECUTE FUNCTION update_board_gallery_updated_at();
