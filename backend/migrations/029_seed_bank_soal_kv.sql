-- Migration 029: Seed Bank Soal - Key-Value Archives & Sample Quiz
-- Purpose: Add example archives (title+link only) and a ready-to-use CBT quiz

-- Quick-link archives (simple key-value: judul + link)
INSERT INTO exam_archives (course_id, title, description, exam_type, year, file_url, file_type) VALUES
(1, '📎 Soal UTS 2023 - Google Drive', 'Link ke Google Drive berisi soal', 'uts', 2023, 'https://drive.google.com/example', 'link'),
(1, '📎 Soal UAS 2023 - Dropbox', 'Link ke Dropbox berisi soal', 'uas', 2023, 'https://dropbox.com/example', 'link'),
(2, '📎 Kuis SQL - YouTube Tutorial', 'Video pembahasan soal SQL', 'kuis', 2024, 'https://youtube.com/example', 'video'),
(2, '📎 Tryout Final - Pastebin', 'Link soal tryout di pastebin', 'tryout', 2024, 'https://pastebin.com/example', 'link')
ON CONFLICT DO NOTHING;

-- New simulation: Kuis Umum (multiple choice, auto-graded)
INSERT INTO simulations (course_id, title, description, duration_minutes) VALUES
(1, 'Kuis Pemrograman Web - 10 Soal', 'Kuis pilihan ganda seputar HTML, CSS, JavaScript', 15),
(2, 'Kuis Basis Data - 10 Soal', 'Kuis pilihan ganda seputar SQL, relasi, normalisasi', 15)
ON CONFLICT DO NOTHING;

-- Quiz questions for Pemrograman Web (gets id=3)
-- Note: simulation ID may vary, using subquery
INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'HTML adalah singkatan dari?', 'multiple_choice',
  '["HyperText Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"]',
  'HyperText Markup Language', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Tag mana yang digunakan untuk link?', 'multiple_choice',
  '["<a>", "<link>", "<href>", "<url>"]',
  '<a>', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'CSS adalah?', 'multiple_choice',
  '["Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"]',
  'Cascading Style Sheets', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Properti CSS untuk font size?', 'multiple_choice',
  '["font-size", "text-size", "font-weight", "text-style"]',
  'font-size', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'JavaScript dijalankan di?', 'multiple_choice',
  '["Browser", "Database", "Server saja", "CSS engine"]',
  'Browser', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Flexbox digunakan untuk?', 'multiple_choice',
  '["Layout elemen di dalam container", "Mengubah warna", "Menambahkan font", "Membuat database"]',
  'Layout elemen di dalam container', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'var x = 10; typeof x menghasilkan?', 'multiple_choice',
  '["number", "string", "boolean", "object"]',
  'number', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Fungsi addEventListener digunakan untuk?', 'multiple_choice',
  '["Menangkap event di DOM", "Menghapus elemen", "Membuat variabel", "Mengubah CSS"]',
  'Menangkap event di DOM', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Tag untuk gambar di HTML?', 'multiple_choice',
  '["<img>", "<image>", "<picture>", "<src>"]',
  '<img>', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'display: none berbeda dari visibility: hidden karena?', 'multiple_choice',
  '["display:none menghilangkan elemen dari layout", "visibility:hidden menghapus elemen", "Keduanya sama", "Tidak ada bedanya"]',
  'display:none menghilangkan elemen dari layout', 1
FROM simulations WHERE title = 'Kuis Pemrograman Web - 10 Soal';

-- Quiz questions for Basis Data (gets id=4)
INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Perintah SQL untuk menghapus tabel?', 'multiple_choice',
  '["DROP TABLE", "DELETE TABLE", "REMOVE TABLE", "ERASE TABLE"]',
  'DROP TABLE', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Normalisasi 3NF menghilangkan?', 'multiple_choice',
  '["Dependency transitif", "Duplikasi data", "Foreign key", "Primary key"]',
  'Dependency transitif', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'SQL JOIN yang mengembalikan semua baris dari tabel kiri?', 'multiple_choice',
  '["LEFT JOIN", "INNER JOIN", "RIGHT JOIN", "CROSS JOIN"]',
  'LEFT JOIN', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Primary key harus bersifat?', 'multiple_choice',
  '["Unik dan tidak null", "Boleh duplikat", "Boleh null", "Tidak perlu unik"]',
  'Unik dan tidak null', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'COUNT(*) menghitung?', 'multiple_choice',
  '["Semua baris termasuk yang null", "Hanya yang tidak null", "Hanya yang unik", "Hanya angka"]',
  'Semua baris termasuk yang null', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Index pada database digunakan untuk?', 'multiple_choice',
  '["Mempercepat query", "Menghemat storage", "Mengenkripsi data", "Menambah data"]',
  'Mempercepat query', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'ACID singkatan dari?', 'multiple_choice',
  '["Atomicity, Consistency, Isolation, Durability", "Automatic, Consistent, Independent, Dynamic", "Atomic, Concurrent, Integrated, Distributed", "Auto, Consistent, Indexed, Durable"]',
  'Atomicity, Consistency, Isolation, Durability', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'Foreign key menghubungkan?', 'multiple_choice',
  '["Dua tabel", "Dua database", "Dua kolom dalam satu tabel", "Dua baris dalam satu tabel"]',
  'Dua tabel', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'GROUP BY digunakan untuk?', 'multiple_choice',
  '["Mengelompokkan baris berdasarkan kolom", "Mengurutkan data", "Menghapus duplikat", "Menggabungkan tabel"]',
  'Mengelompokkan baris berdasarkan kolom', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
SELECT id, 'WHERE clause dieksekusi?', 'multiple_choice',
  '["Sebelum GROUP BY", "Setelah GROUP BY", "Bersamaan dengan SELECT", "Setelah ORDER BY"]',
  'Sebelum GROUP BY', 1
FROM simulations WHERE title = 'Kuis Basis Data - 10 Soal';
