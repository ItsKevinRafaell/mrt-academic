-- Active cawu system for filtering data by current semester

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial active cawu (Cawu 3)
INSERT INTO system_settings (key, value)
VALUES ('active_cawu_id', '3')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;

-- Index for courses by cawu
CREATE INDEX IF NOT EXISTS idx_courses_cawu_id ON courses(cawu_id);
