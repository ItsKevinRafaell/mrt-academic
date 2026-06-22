-- 027: Material sharing request system
-- Enables Course A to request materials from Course B, Kurikulum approves

CREATE TABLE IF NOT EXISTS material_requests (
    id                      SERIAL PRIMARY KEY,
    requesting_course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    requested_by            UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose                 TEXT    NOT NULL,
    material_id             INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    requested_at            TIMESTAMP DEFAULT NOW(),
    reviewed_at             TIMESTAMP,
    reviewed_by            UUID    REFERENCES users(id) ON DELETE SET NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
    review_note             TEXT,
    is_active               BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_req_status      ON material_requests(status);
CREATE INDEX IF NOT EXISTS idx_req_req_course  ON material_requests(requesting_course_id);
CREATE INDEX IF NOT EXISTS idx_req_material    ON material_requests(material_id);
CREATE INDEX IF NOT EXISTS idx_req_requested_by ON material_requests(requested_by);

-- Add created_by to materials for tracking ownership
ALTER TABLE materials ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
