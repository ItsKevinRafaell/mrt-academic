-- Migration: Add score column to grades table for multi-component grading system
-- This allows storing the actual score (0-100) alongside the letter grade

ALTER TABLE grades ADD COLUMN IF NOT EXISTS score DECIMAL(5,2);

-- Add index for faster queries on score
CREATE INDEX IF NOT EXISTS idx_grades_score ON grades(score);

-- Add check constraint to ensure score is within valid range
ALTER TABLE grades ADD CONSTRAINT grades_score_check
    CHECK (score >= 0 AND score <= 100);
