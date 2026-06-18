-- Reset and seed test data for Cawu 3 & 4
-- Run this after migrations are applied

-- Clear existing test data (be careful in production!)
TRUNCATE TABLE grades, grade_components, task_progress, tasks, materials, sessions, topics, courses, user_roles, users, cawu RESTART IDENTITY CASCADE;

-- Insert Cawu 3 and 4
INSERT INTO cawu (name, year, semester, is_active) VALUES
('Cawu 3 2024', 2024, 3, TRUE),
('Cawu 4 2025', 2025, 4, FALSE);

-- Insert 10 new courses for Cawu 3 & 4
INSERT INTO courses (code, name, description, sks, cawu_id) VALUES
-- Cawu 3 (5 courses)
('PROGWEB', 'Pemrograman Web', 'Pengembangan aplikasi web modern dengan HTML, CSS, JavaScript, dan framework', 3, 1),
('BASISDATA', 'Basis Data', 'Konsep dan implementasi database relasional dan non-relasional', 3, 1),
('JARKOM', 'Jaringan Komputer', 'Protokol jaringan, arsitektur OSI, dan implementasi network', 3, 1),
('SISTOP', 'Sistem Operasi', 'Konsep sistem operasi, process management, dan memory management', 2, 1),
('AI', 'Kecerdasan Buatan', 'Algoritma AI, machine learning, dan deep learning', 3, 1),

-- Cawu 4 (5 courses)
('PROGMOD', 'Pemrograman Mobile', 'Pengembangan aplikasi mobile Android dan iOS', 3, 2),
('KEAMJAR', 'Keamanan Jaringan', 'Kriptografi, firewall, dan network security', 2, 2),
('ML', 'Machine Learning', 'Supervised learning, unsupervised learning, dan neural networks', 3, 2),
('CLOUD', 'Cloud Computing', 'AWS, Google Cloud, Azure, dan containerization', 3, 2),
('PROAK', 'Proyek Akhir', 'Proyek integrasi semua mata kuliah', 4, 2);

-- Insert topics for each course (2 topics per course)
INSERT INTO topics (course_id, title, description, order_number) VALUES
-- PROGWEB
(1, 'Frontend Development', 'HTML5, CSS3, JavaScript ES6+, React', 1),
(1, 'Backend Development', 'Node.js, Express, REST API', 2),
-- BASISDATA
(2, 'Database Design', 'ERD, normalization, SQL', 1),
(2, 'Database Administration', 'Indexing, optimization, backup', 2),
-- JARKOM
(3, 'Network Fundamentals', 'OSI model, TCP/IP, subnetting', 1),
(3, 'Network Services', 'DNS, DHCP, HTTP, FTP', 2),
-- SISTOP
(4, 'Process Management', 'Scheduling, synchronization, deadlock', 1),
(4, 'Memory Management', 'Paging, segmentation, virtual memory', 2),
-- AI
(5, 'Search Algorithms', 'BFS, DFS, A*, genetic algorithms', 1),
(5, 'Machine Learning Basics', 'Regression, classification, clustering', 2),
-- PROGMOD
(6, 'Mobile UI/UX', 'Material Design, responsive layout', 1),
(6, 'Mobile Backend Integration', 'API integration, local storage', 2),
-- KEAMJAR
(7, 'Cryptography', 'Symmetric, asymmetric, hashing', 1),
(7, 'Network Security', 'Firewall, IDS/IPS, VPN', 2),
-- ML
(8, 'Supervised Learning', 'Linear regression, decision trees, SVM', 1),
(8, 'Neural Networks', 'Perceptron, backpropagation, CNN', 2),
-- CLOUD
(9, 'Cloud Services', 'IaaS, PaaS, SaaS, serverless', 1),
(9, 'Containerization', 'Docker, Kubernetes, microservices', 2),
-- PROAK
(10, 'Project Planning', 'Requirements, timeline, resource allocation', 1),
(10, 'Project Implementation', 'Development, testing, deployment', 2);

-- Insert sessions for each course (2 sessions per topic, 2 topics per course = 4 sessions per course)
INSERT INTO sessions (course_id, topic_id, number, title, description) VALUES
-- PROGWEB (course_id=1)
(1, 1, 1, 'HTML5 & CSS3 Basics', 'Struktur HTML dan styling dengan CSS'),
(1, 1, 2, 'JavaScript Fundamentals', 'Variables, functions, DOM manipulation'),
(1, 2, 3, 'Node.js Introduction', 'Server-side JavaScript runtime'),
(1, 2, 4, 'Building REST APIs', 'Express framework dan API design'),
-- BASISDATA (course_id=2)
(2, 3, 1, 'ERD Modeling', 'Entity-Relationship Diagram design'),
(2, 3, 2, 'SQL Queries', 'SELECT, JOIN, subqueries'),
(2, 4, 3, 'Indexing Strategies', 'B-tree, hash, composite indexes'),
(2, 4, 4, 'Performance Tuning', 'Query optimization dan caching'),
-- JARKOM (course_id=3)
(3, 5, 1, 'OSI Model Layers', '7 layer model dan fungsinya'),
(3, 5, 2, 'IP Addressing', 'IPv4, IPv6, subnetting'),
(3, 6, 3, 'DNS Configuration', 'Domain Name System setup'),
(3, 6, 4, 'Web Server Setup', 'Apache/Nginx configuration'),
-- SISTOP (course_id=4)
(4, 7, 1, 'Process Scheduling', 'FCFS, SJF, Round Robin'),
(4, 7, 2, 'Synchronization', 'Mutex, semaphore, monitors'),
(4, 8, 3, 'Paging', 'Page tables, TLB, page replacement'),
(4, 8, 4, 'Virtual Memory', 'Demand paging, thrashing'),
-- AI (course_id=5)
(5, 9, 1, 'Uninformed Search', 'BFS, DFS, iterative deepening'),
(5, 9, 2, 'Informed Search', 'Greedy, A*, heuristics'),
(5, 10, 3, 'Linear Regression', 'Simple dan multiple regression'),
(5, 10, 4, 'Classification', 'KNN, Naive Bayes, decision trees'),
-- PROGMOD (course_id=6)
(6, 11, 1, 'Mobile Layout Basics', 'ConstraintLayout, RecyclerView'),
(6, 11, 2, 'Material Components', 'Buttons, cards, navigation'),
(6, 12, 3, 'REST API Integration', 'Retrofit, JSON parsing'),
(6, 12, 4, 'Local Database', 'Room, SQLite, SharedPreferences'),
-- KEAMJAR (course_id=7)
(7, 13, 1, 'Symmetric Encryption', 'AES, DES, 3DES'),
(7, 13, 2, 'Asymmetric Encryption', 'RSA, Diffie-Hellman'),
(7, 14, 3, 'Firewall Rules', 'iptables, ufw configuration'),
(7, 14, 4, 'VPN Setup', 'OpenVPN, WireGuard'),
-- ML (course_id=8)
(8, 15, 1, 'Regression Models', 'Linear, polynomial, ridge regression'),
(8, 15, 2, 'Classification Models', 'Logistic regression, SVM'),
(8, 16, 3, 'Neural Network Basics', 'Perceptron, activation functions'),
(8, 16, 4, 'Deep Learning', 'CNN, RNN, transfer learning'),
-- CLOUD (course_id=9)
(9, 17, 1, 'AWS Services', 'EC2, S3, Lambda, RDS'),
(9, 17, 2, 'Serverless Architecture', 'Lambda, API Gateway, DynamoDB'),
(9, 18, 3, 'Docker Fundamentals', 'Images, containers, volumes'),
(9, 18, 4, 'Kubernetes Basics', 'Pods, services, deployments'),
-- PROAK (course_id=10)
(10, 19, 1, 'Project Scoping', 'Requirements gathering, user stories'),
(10, 19, 2, 'Timeline Planning', 'Gantt chart, milestones'),
(10, 20, 3, 'Agile Development', 'Sprints, daily standup, retrospectives'),
(10, 20, 4, 'Deployment & Testing', 'CI/CD, unit testing, integration testing');

-- Insert materials for some sessions (1 material per session for first 10 sessions)
INSERT INTO materials (session_id, title, type, url, description) VALUES
(1, 'HTML5 Reference', 'link', 'https://developer.mozilla.org/en-US/docs/Web/HTML', 'Dokumentasi HTML5 lengkap'),
(2, 'JavaScript Guide', 'link', 'https://javascript.info/', 'Tutorial JavaScript modern'),
(3, 'Node.js Docs', 'link', 'https://nodejs.org/docs/latest/api/', 'API documentation Node.js'),
(4, 'Express Tutorial', 'video', 'https://www.youtube.com/watch?v=L72fhGm1tfE', 'Video tutorial Express.js'),
(5, 'ERD Examples', 'doc', 'https://example.com/erd-guide.pdf', 'Panduan membuat ERD'),
(6, 'SQL Cheat Sheet', 'doc', 'https://example.com/sql-cheatsheet.pdf', 'Cheat sheet SQL queries'),
(7, 'Indexing Guide', 'link', 'https://use-the-index-luke.com/', 'Tutorial database indexing'),
(8, 'Query Optimization', 'video', 'https://www.youtube.com/watch?v=TqMkRnJFRgY', 'Video optimasi query'),
(9, 'OSI Model Infographic', 'image', 'https://example.com/osi-model.png', 'Infografis model OSI'),
(10, 'Subnetting Calculator', 'link', 'https://www.subnet-calculator.com/', 'Kalkulator subnet');

-- Insert tasks for each course (2 tasks per course)
INSERT INTO tasks (course_id, title, description, deadline, type, max_score) VALUES
(1, 'Project Website Portfolio', 'Buat website portfolio personal dengan HTML, CSS, JS', '2024-10-15 23:59:59', 'project', 100),
(1, 'Quiz Frontend Frameworks', 'Quiz tentang React, Vue, Angular', '2024-09-30 23:59:59', 'quiz', 100),
(2, 'ERD Design Assignment', 'Desain ERD untuk sistem perpustakaan', '2024-10-20 23:59:59', 'assignment', 100),
(2, 'SQL Query Challenge', 'Selesaikan 20 query SQL kompleks', '2024-10-10 23:59:59', 'assignment', 100),
(3, 'Network Topology Project', 'Desain topologi jaringan untuk kantor', '2024-10-25 23:59:59', 'project', 100),
(3, 'Quiz Network Protocols', 'Quiz tentang TCP/IP, HTTP, FTP', '2024-10-05 23:59:59', 'quiz', 100),
(4, 'Process Scheduling Simulation', 'Simulasi algoritma scheduling', '2024-11-01 23:59:59', 'project', 100),
(4, 'Quiz OS Concepts', 'Quiz konsep dasar sistem operasi', '2024-10-15 23:59:59', 'quiz', 100),
(5, 'AI Search Algorithm Implementation', 'Implementasi algoritma A*', '2024-11-10 23:59:59', 'project', 100),
(5, 'Quiz ML Basics', 'Quiz dasar-dasar machine learning', '2024-10-20 23:59:59', 'quiz', 100),
(6, 'Mobile App Prototype', 'Prototype aplikasi mobile sederhana', '2025-02-15 23:59:59', 'project', 100),
(6, 'Quiz Mobile UX', 'Quiz tentang mobile user experience', '2025-01-30 23:59:59', 'quiz', 100),
(7, 'Encryption Implementation', 'Implementasi AES dan RSA', '2025-02-20 23:59:59', 'project', 100),
(7, 'Quiz Cryptography', 'Quiz tentang kriptografi', '2025-02-05 23:59:59', 'quiz', 100),
(8, 'ML Model Training', 'Training model klasifikasi dengan dataset', '2025-03-01 23:59:59', 'project', 100),
(8, 'Quiz Neural Networks', 'Quiz tentang neural networks', '2025-02-15 23:59:59', 'quiz', 100),
(9, 'Cloud Deployment Project', 'Deploy aplikasi ke AWS/GCP', '2025-03-10 23:59:59', 'project', 100),
(9, 'Quiz Cloud Services', 'Quiz tentang layanan cloud', '2025-02-25 23:59:59', 'quiz', 100),
(10, 'Final Project Proposal', 'Proposal proyek akhir', '2025-03-20 23:59:59', 'assignment', 100),
(10, 'Final Project Implementation', 'Implementasi proyek akhir lengkap', '2025-04-15 23:59:59', 'project', 100);

-- Insert grade components for each course (3 components: UTS 30%, UAS 40%, Tugas 30%)
INSERT INTO grade_components (course_id, name, weight, type) VALUES
(1, 'UTS', 30, 'lecture'),
(1, 'UAS', 40, 'lecture'),
(1, 'Tugas', 30, 'lecture'),
(2, 'UTS', 30, 'lecture'),
(2, 'UAS', 40, 'lecture'),
(2, 'Tugas', 30, 'lecture'),
(3, 'UTS', 30, 'lecture'),
(3, 'UAS', 40, 'lecture'),
(3, 'Tugas', 30, 'lecture'),
(4, 'UTS', 30, 'lecture'),
(4, 'UAS', 40, 'lecture'),
(4, 'Tugas', 30, 'lecture'),
(5, 'UTS', 30, 'lecture'),
(5, 'UAS', 40, 'lecture'),
(5, 'Tugas', 30, 'lecture'),
(6, 'UTS', 30, 'lecture'),
(6, 'UAS', 40, 'lecture'),
(6, 'Tugas', 30, 'lecture'),
(7, 'UTS', 30, 'lecture'),
(7, 'UAS', 40, 'lecture'),
(7, 'Tugas', 30, 'lecture'),
(8, 'UTS', 30, 'lecture'),
(8, 'UAS', 40, 'lecture'),
(8, 'Tugas', 30, 'lecture'),
(9, 'UTS', 30, 'lecture'),
(9, 'UAS', 40, 'lecture'),
(9, 'Tugas', 30, 'lecture'),
(10, 'UTS', 30, 'lecture'),
(10, 'UAS', 40, 'lecture'),
(10, 'Tugas', 30, 'lecture');

-- Insert student accounts (password: password123 for all)
-- Password hash for "password123": $2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y
-- (Note: This is a placeholder hash. Use bcrypt to generate proper hash in production)
INSERT INTO users (email, password_hash, full_name, nim) VALUES
('budi.santoso@mhs.mrt.ac.id', '$2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y', 'Budi Santoso', '2024001'),
('siti.rahayu@mhs.mrt.ac.id', '$2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y', 'Siti Rahayu', '2024002'),
('ahmad.wijaya@mhs.mrt.ac.id', '$2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y', 'Ahmad Wijaya', '2024003'),
('dewi.lestari@mhs.mrt.ac.id', '$2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y', 'Dewi Lestari', '2024004'),
('rizky.pratama@mhs.mrt.ac.id', '$2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y', 'Rizky Pratama', '2024005'),
('putri.amanda@mhs.mrt.ac.id', '$2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y', 'Putri Amanda', '2024006'),
('dimas.kurniawan@mhs.mrt.ac.id', '$2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y', 'Dimas Kurniawan', '2024007'),
('rina.sulistyawati@mhs.mrt.ac.id', '$2a$10$rZ5YzH5YzH5YzH5YzH5YzO5YzH5YzH5YzH5YzH5YzH5YzH5YzH5Y', 'Rina Sulistyawati', '2024008');

-- Assign roles to users
INSERT INTO user_roles (user_id, role) VALUES
((SELECT id FROM users WHERE email = 'budi.santoso@mhs.mrt.ac.id'), 'MAHASISWA'),
((SELECT id FROM users WHERE email = 'siti.rahayu@mhs.mrt.ac.id'), 'MAHASISWA'),
((SELECT id FROM users WHERE email = 'ahmad.wijaya@mhs.mrt.ac.id'), 'MAHASISWA'),
((SELECT id FROM users WHERE email = 'dewi.lestari@mhs.mrt.ac.id'), 'MAHASISWA'),
((SELECT id FROM users WHERE email = 'rizky.pratama@mhs.mrt.ac.id'), 'MAHASISWA'),
((SELECT id FROM users WHERE email = 'putri.amanda@mhs.mrt.ac.id'), 'MAHASISWA'),
((SELECT id FROM users WHERE email = 'dimas.kurniawan@mhs.mrt.ac.id'), 'KOMTI'),
((SELECT id FROM users WHERE email = 'rina.sulistyawati@mhs.mrt.ac.id'), 'WAKOMTI');

-- Set active cawu to Cawu 3 (id=1 is Cawu 3 2024)
UPDATE cawu SET is_active = FALSE;
UPDATE cawu SET is_active = TRUE WHERE id = 1;
