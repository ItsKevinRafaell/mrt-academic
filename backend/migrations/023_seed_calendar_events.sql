-- Calendar Events Seed Data
-- Run this after migration 017_create_calendar_events.sql

-- Sample calendar events for testing (using valid UUIDs)
INSERT INTO calendar_events (
    id, title, description, event_type, start_time, end_time,
    is_recurring, recurrence_pattern, course_id, topic_id, session_id,
    is_active_session, created_by, created_at, updated_at
) VALUES
(
    gen_random_uuid(), 'Kelas Pemrograman Web', 'Sesi pengantar HTML & CSS',
    'class', '2026-06-17 13:00:00', '2026-06-17 14:30:00',
    true, 'weekly', 1, 1, 1,
    false, '7b744d81-9d38-4401-a138-95ff8b9449ec', NOW(), NOW()
),
(
    gen_random_uuid(), 'Kelas Basis Data', 'Sesi normalisasi database',
    'class', '2026-06-17 15:00:00', '2026-06-17 16:30:00',
    true, 'weekly', 2, 3, 5,
    false, '7b744d81-9d38-4401-a138-95ff8b9449ec', NOW(), NOW()
),
(
    gen_random_uuid(), 'Ujian Tengah Semester', 'UTS mata kuliah Pemrograman Web',
    'exam', '2026-06-24 13:00:00', '2026-06-24 15:00:00',
    false, NULL, 1, NULL, NULL,
    false, '7b744d81-9d38-4401-a138-95ff8b9449ec', NOW(), NOW()
),
(
    gen_random_uuid(), 'Deadline Tugas Besar', 'Pengumpulan tugas besar Basis Data',
    'deadline', '2026-06-20 23:00:00', '2026-06-20 23:59:59',
    false, NULL, 2, NULL, NULL,
    false, '7b744d81-9d38-4401-a138-95ff8b9449ec', NOW(), NOW()
),
(
    gen_random_uuid(), 'Meeting Kurikulum', 'Rapat evaluasi kurikulum semester ganjil',
    'meeting', '2026-06-18 10:00:00', '2026-06-18 12:00:00',
    false, NULL, NULL, NULL, NULL,
    false, '7b744d81-9d38-4401-a138-95ff8b9449ec', NOW(), NOW()
),
(
    gen_random_uuid(), 'Libur Nasional', 'Hari Raya Idul Adha',
    'holiday', '2026-06-17 00:00:00', '2026-06-17 23:59:58',
    false, NULL, NULL, NULL, NULL,
    false, '7b744d81-9d38-4401-a138-95ff8b9449ec', NOW(), NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_active ON calendar_events(is_active_session);
