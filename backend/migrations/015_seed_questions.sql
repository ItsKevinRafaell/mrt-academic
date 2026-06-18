-- Seed bank soal dengan dummy data
-- 5 soal PDF dan 5 soal simulasi ujian

INSERT INTO questions (course_id, title, description, type, difficulty, points, file_url, created_at, updated_at) VALUES
-- PDF Questions
(1, 'Soal Latihan Algoritma Dasar', 'Kumpulan soal latihan tentang algoritma sorting dan searching', 'pdf', 'easy', 10, 'https://example.com/soal-algoritma.pdf', NOW(), NOW()),
(2, 'Soal UTS Basis Data 2024', 'Soal UTS mata kuliah Basis Data semester genap 2024', 'pdf', 'medium', 50, 'https://example.com/uts-basisdata.pdf', NOW(), NOW()),
(3, 'Latihan Soal Jaringan Komputer', 'Soal-soal latihan tentang topologi jaringan dan protokol', 'pdf', 'medium', 20, 'https://example.com/latihan-jarkom.pdf', NOW(), NOW()),
(4, 'Soal Quiz Pemrograman Web', 'Quiz tentang HTML, CSS, dan JavaScript dasar', 'pdf', 'easy', 15, 'https://example.com/quiz-web.pdf', NOW(), NOW()),
(5, 'Soal UAS Sistem Operasi', 'Soal UAS lengkap dengan studi kasus', 'pdf', 'hard', 100, 'https://example.com/uas-sistop.pdf', NOW(), NOW()),

-- Exam Simulation Questions
(1, 'Simulasi Ujian Algoritma - Sesi 1', 'Simulasi ujian online dengan timer 60 menit', 'exam', 'medium', 100, NULL, NOW(), NOW()),
(2, 'Simulasi Quiz SQL', 'Quiz interaktif tentang SQL queries', 'exam', 'easy', 50, NULL, NOW(), NOW()),
(3, 'Simulasi Ujian Jaringan - TCP/IP', 'Simulasi ujian tentang protokol TCP/IP', 'exam', 'hard', 100, NULL, NOW(), NOW()),
(4, 'Simulasi Quiz Frontend Framework', 'Quiz tentang React, Vue, dan Angular', 'exam', 'medium', 75, NULL, NOW(), NOW()),
(5, 'Simulasi Ujian Proses & Thread', 'Simulasi ujian tentang manajemen proses dan thread', 'exam', 'hard', 100, NULL, NOW(), NOW());

-- Add exam options for exam-type questions
INSERT INTO question_options (question_id, option_text, is_correct, created_at) VALUES
-- Question 6: Simulasi Ujian Algoritma
(6, 'Bubble Sort memiliki kompleksitas waktu O(n²)', true, NOW()),
(6, 'Quick Sort selalu lebih cepat dari Merge Sort', false, NOW()),
(6, 'Binary Search bekerja pada array yang tidak terurut', false, NOW()),
(6, 'Insertion Sort lebih efisien untuk array besar', false, NOW()),

-- Question 7: Simulasi Quiz SQL
(7, 'SELECT * FROM users WHERE age > 18', true, NOW()),
(7, 'GET * FROM users WHERE age > 18', false, NOW()),
(7, 'FETCH * FROM users WHERE age > 18', false, NOW()),
(7, 'QUERY * FROM users WHERE age > 18', false, NOW()),

-- Question 8: Simulasi Ujian Jaringan
(8, 'TCP menggunakan three-way handshake', true, NOW()),
(8, 'UDP lebih reliable daripada TCP', false, NOW()),
(8, 'HTTP bekerja di layer 3 OSI', false, NOW()),
(8, 'IP Address adalah alamat fisik perangkat', false, NOW()),

-- Question 9: Simulasi Quiz Frontend
(9, 'React menggunakan Virtual DOM', true, NOW()),
(9, 'Vue.js dikembangkan oleh Facebook', false, NOW()),
(9, 'Angular tidak mendukung TypeScript', false, NOW()),
(9, 'Semua framework di atas tidak menggunakan komponen', false, NOW()),

-- Question 10: Simulasi Ujian Proses & Thread
(10, 'Thread berbagi memory space dengan proses induk', true, NOW()),
(10, 'Proses lebih ringan daripada thread', false, NOW()),
(10, 'Context switching pada thread lebih lambat dari proses', false, NOW()),
(10, 'Thread tidak dapat berkomunikasi satu sama lain', false, NOW());
