-- Migration: Bank Soal (Exam Archives & Simulations)
-- Purpose: Create tables for exam archives and CBT simulations

-- Table: exam_archives (arsip soal ujian)
CREATE TABLE IF NOT EXISTS exam_archives (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  exam_type VARCHAR(50) NOT NULL, -- 'uts', 'uas', 'kuis', 'tryout'
  year INTEGER NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) DEFAULT 'pdf',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: simulations (simulasi CBT)
CREATE TABLE IF NOT EXISTS simulations (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: simulation_questions (soal simulasi)
CREATE TABLE IF NOT EXISTS simulation_questions (
  id SERIAL PRIMARY KEY,
  simulation_id INTEGER NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL, -- 'multiple_choice', 'essay'
  options JSONB, -- JSON array for multiple choice options
  correct_answer TEXT, -- For auto-grading
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_archives_course ON exam_archives(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_archives_year ON exam_archives(year);
CREATE INDEX IF NOT EXISTS idx_simulations_course ON simulations(course_id);
CREATE INDEX IF NOT EXISTS idx_simulation_questions_simulation ON simulation_questions(simulation_id);
