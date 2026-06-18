-- Add missing columns to grades table
ALTER TABLE grades ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create cawu table
CREATE TABLE IF NOT EXISTS cawu (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, semester)
);

-- Add cawu_id to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cawu_id INTEGER REFERENCES cawu(id) ON DELETE SET NULL;

-- Insert some sample cawu data
INSERT INTO cawu (name, year, semester) VALUES
    ('Cawu 1', 2024, 1),
    ('Cawu 2', 2024, 2),
    ('Cawu 3', 2025, 1)
ON CONFLICT (year, semester) DO NOTHING;
