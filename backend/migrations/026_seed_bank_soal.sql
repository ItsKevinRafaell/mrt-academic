-- Migration 021: Seed Bank Soal Data
-- Purpose: Insert sample exam archives, simulations, and questions

-- Seed exam archives
INSERT INTO exam_archives (course_id, title, description, exam_type, year, file_url) VALUES
(1, 'UTS Pemrograman Web 2024', 'Soal UTS mata kuliah Pemrograman Web', 'uts', 2024, '/uploads/bank-soal/uts-progweb-2024.pdf'),
(1, 'UAS Pemrograman Web 2024', 'Soal UAS mata kuliah Pemrograman Web', 'uas', 2024, '/uploads/bank-soal/uas-progweb-2024.pdf'),
(2, 'UTS Basis Data 2024', 'Soal UTS mata kuliah Basis Data', 'uts', 2024, '/uploads/bank-soal/uts-basisdata-2024.pdf'),
(2, 'UAS Basis Data 2024', 'Soal UAS mata kuliah Basis Data', 'uas', 2024, '/uploads/bank-soal/uas-basisdata-2024.pdf'),
(1, 'Kuis HTML & CSS', 'Kuis kecil tentang HTML dan CSS', 'kuis', 2024, '/uploads/bank-soal/kuis-html-css-2024.pdf')
ON CONFLICT DO NOTHING;

-- Seed simulations
INSERT INTO simulations (course_id, title, description, duration_minutes) VALUES
(1, 'Simulasi UTS Pemrograman Web', 'Simulasi ujian UTS Pemrograman Web', 90),
(2, 'Simulasi UTS Basis Data', 'Simulasi ujian UTS Basis Data', 90)
ON CONFLICT DO NOTHING;

-- Seed simulation questions for Simulasi UTS Pemrograman Web (id=1)
INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points) VALUES
(1, 'Apa itu HTML?', 'multiple_choice', '["HyperText Markup Language", "High Text Machine Language", "HyperText Machine Language", "High Text Markup Language"]', 'HyperText Markup Language', 1),
(1, 'Tag HTML yang digunakan untuk membuat paragraf adalah?', 'multiple_choice', '["<p>", "<paragraph>", "<text>", "<para>"]', '<p>', 1),
(1, 'Properti CSS untuk mengubah warna background adalah?', 'multiple_choice', '["background-color", "color", "bgcolor", "bg-color"]', 'background-color', 1),
(1, 'Jelaskan perbedaan antara var, let, dan const di JavaScript!', 'essay', NULL, NULL, 5),
(1, 'Apa fungsi dari method GET dan POST dalam HTTP?', 'essay', NULL, NULL, 5);

-- Seed simulation questions for Simulasi UTS Basis Data (id=2)
INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points) VALUES
(2, 'Apa itu primary key?', 'multiple_choice', '["Kunci unik untuk mengidentifikasi setiap record", "Kunci untuk menghapus data", "Kunci untuk login ke database", "Kunci untuk mengenkripsi data"]', 'Kunci unik untuk mengidentifikasi setiap record', 1),
(2, 'Perintah SQL untuk mengambil data adalah?', 'multiple_choice', '["SELECT", "GET", "FETCH", "RETRIEVE"]', 'SELECT', 1),
(2, 'Apa itu foreign key?', 'multiple_choice', '["Kunci yang mereferensi primary key di tabel lain", "Kunci untuk akses dari luar", "Kunci untuk backup data", "Kunci untuk indexing"]', 'Kunci yang mereferensi primary key di tabel lain', 1),
(2, 'Jelaskan perbedaan antara INNER JOIN dan LEFT JOIN!', 'essay', NULL, NULL, 5),
(2, 'Apa itu normalisasi database dan mengapa penting?', 'essay', NULL, NULL, 5);
