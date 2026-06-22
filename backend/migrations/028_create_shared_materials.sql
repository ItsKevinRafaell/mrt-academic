-- 028: Shared materials records
-- Tracks approved material sharing between courses

CREATE TABLE IF NOT EXISTS shared_materials (
    id                  SERIAL PRIMARY KEY,
    request_id          INTEGER NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
    material_id         INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    target_course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    source_course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    shared_by           UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_at           TIMESTAMP DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sm_unique_share
    ON shared_materials(material_id, target_course_id) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sm_target ON shared_materials(target_course_id);
CREATE INDEX IF NOT EXISTS idx_sm_source ON shared_materials(source_course_id);
CREATE INDEX IF NOT EXISTS idx_sm_material ON shared_materials(material_id);
