-- Migration: Add dummy materials data for sessions
-- This ensures session detail pages have content to display

-- First, let's check what sessions exist and add materials for them
-- Materials types: pdf, link, video, image

-- PROGWEB (course_id=1) - Sessions 1-4
INSERT INTO materials (session_id, title, description, type, url, created_at, updated_at) VALUES
(1, 'HTML5 Dasar', 'Materi pengenalan HTML5 dan struktur dasar', 'pdf', 'https://example.com/html5-basics.pdf', NOW(), NOW()),
(1, 'CSS Styling', 'Panduan styling dengan CSS', 'pdf', 'https://example.com/css-styling.pdf', NOW(), NOW()),
(1, 'Video Tutorial HTML', 'Tutorial lengkap HTML dasar', 'video', 'https://youtube.com/watch?v=html5tutorial', NOW(), NOW()),
(2, 'JavaScript Fundamentals', 'Konsep dasar JavaScript', 'pdf', 'https://example.com/js-fundamentals.pdf', NOW(), NOW()),
(2, 'JavaScript Documentation', 'Dokumentasi resmi JavaScript', 'link', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', NOW(), NOW()),
(3, 'DOM Manipulation', 'Cara memanipulasi DOM dengan JavaScript', 'pdf', 'https://example.com/dom-manipulation.pdf', NOW(), NOW()),
(3, 'Video: DOM Tutorial', 'Tutorial interaktif DOM', 'video', 'https://youtube.com/watch?v=dom-tutorial', NOW(), NOW()),
(4, 'Form Handling', 'Penanganan form dengan JavaScript', 'pdf', 'https://example.com/form-handling.pdf', NOW(), NOW()),
(4, 'GitHub Resources', 'Repository contoh kode', 'link', 'https://github.com/examples/web-forms', NOW(), NOW()),

-- BASISDATA (course_id=2) - Sessions 5-8
(5, 'ERD Concepts', 'Konsep Entity Relationship Diagram', 'pdf', 'https://example.com/erd-concepts.pdf', NOW(), NOW()),
(5, 'ERD Examples', 'Contoh-contoh ERD', 'image', 'https://example.com/erd-examples.png', NOW(), NOW()),
(6, 'SQL Basics', 'Dasar-dasar SQL queries', 'pdf', 'https://example.com/sql-basics.pdf', NOW(), NOW()),
(6, 'SQL Tutorial', 'Tutorial SQL interaktif', 'link', 'https://sqlbolt.com/', NOW(), NOW()),
(6, 'Video: SQL Joins', 'Tutorial SQL Joins', 'video', 'https://youtube.com/watch?v=sql-joins', NOW(), NOW()),
(7, 'Database Normalization', 'Proses normalisasi database', 'pdf', 'https://example.com/normalization.pdf', NOW(), NOW()),
(7, 'Normalization Examples', 'Contoh normalisasi 1NF, 2NF, 3NF', 'pdf', 'https://example.com/normalization-examples.pdf', NOW(), NOW()),
(8, 'Database Design Best Practices', 'Best practices dalam desain database', 'pdf', 'https://example.com/db-best-practices.pdf', NOW(), NOW()),
(8, 'Case Studies', 'Studi kasus desain database', 'link', 'https://example.com/db-case-studies', NOW(), NOW()),

-- JARKOM (course_id=3) - Sessions 9-12
(9, 'Network Topologies', 'Jenis-jenis topologi jaringan', 'pdf', 'https://example.com/network-topologies.pdf', NOW(), NOW()),
(9, 'Topology Diagrams', 'Diagram topologi jaringan', 'image', 'https://example.com/topology-diagrams.png', NOW(), NOW()),
(10, 'TCP/IP Protocol', 'Protokol TCP/IP dan cara kerjanya', 'pdf', 'https://example.com/tcp-ip.pdf', NOW(), NOW()),
(10, 'TCP/IP Tutorial', 'Tutorial lengkap TCP/IP', 'link', 'https://example.com/tcp-ip-tutorial', NOW(), NOW()),
(11, 'Network Devices', 'Perangkat-perangkat jaringan', 'pdf', 'https://example.com/network-devices.pdf', NOW(), NOW()),
(11, 'Video: Router Configuration', 'Tutorial konfigurasi router', 'video', 'https://youtube.com/watch?v=router-config', NOW(), NOW()),
(12, 'Network Security Basics', 'Dasar-dasar keamanan jaringan', 'pdf', 'https://example.com/network-security.pdf', NOW(), NOW()),
(12, 'Security Resources', 'Sumber daya keamanan jaringan', 'link', 'https://example.com/security-resources', NOW(), NOW()),

-- SISTOP (course_id=4) - Sessions 13-16
(13, 'Process Management', 'Manajemen proses dalam sistem operasi', 'pdf', 'https://example.com/process-management.pdf', NOW(), NOW()),
(13, 'Process Scheduling', 'Algoritma penjadwalan proses', 'pdf', 'https://example.com/process-scheduling.pdf', NOW(), NOW()),
(14, 'Memory Management', 'Manajemen memori virtual', 'pdf', 'https://example.com/memory-management.pdf', NOW(), NOW()),
(14, 'Video: Paging & Segmentation', 'Tutorial paging dan segmentasi', 'video', 'https://youtube.com/watch?v=paging-segmentation', NOW(), NOW()),
(15, 'File Systems', 'Sistem file dan organisasi', 'pdf', 'https://example.com/file-systems.pdf', NOW(), NOW()),
(15, 'File System Examples', 'Contoh implementasi file system', 'link', 'https://example.com/fs-examples', NOW(), NOW()),
(16, 'Device Drivers', 'Driver perangkat dan I/O', 'pdf', 'https://example.com/device-drivers.pdf', NOW(), NOW()),
(16, 'I/O Management', 'Manajemen input/output', 'pdf', 'https://example.com/io-management.pdf', NOW(), NOW()),

-- AI (course_id=5) - Sessions 17-20
(17, 'AI Introduction', 'Pengantar kecerdasan buatan', 'pdf', 'https://example.com/ai-intro.pdf', NOW(), NOW()),
(17, 'AI History', 'Sejarah perkembangan AI', 'link', 'https://example.com/ai-history', NOW(), NOW()),
(18, 'Search Algorithms', 'Algoritma pencarian dalam AI', 'pdf', 'https://example.com/search-algorithms.pdf', NOW(), NOW()),
(18, 'Video: A* Algorithm', 'Tutorial algoritma A*', 'video', 'https://youtube.com/watch?v=a-star-algorithm', NOW(), NOW()),
(19, 'Machine Learning Basics', 'Dasar-dasar machine learning', 'pdf', 'https://example.com/ml-basics.pdf', NOW(), NOW()),
(19, 'ML Resources', 'Sumber belajar machine learning', 'link', 'https://example.com/ml-resources', NOW(), NOW()),
(20, 'Neural Networks', 'Jaringan saraf tiruan', 'pdf', 'https://example.com/neural-networks.pdf', NOW(), NOW()),
(20, 'Neural Network Diagram', 'Diagram arsitektur neural network', 'image', 'https://example.com/nn-diagram.png', NOW(), NOW()),

-- PROGMOD (course_id=6) - Sessions 21-24
(21, 'Mobile Development Overview', 'Gambaran umum pengembangan mobile', 'pdf', 'https://example.com/mobile-dev-overview.pdf', NOW(), NOW()),
(21, 'Mobile Platforms', 'Platform mobile: Android vs iOS', 'pdf', 'https://example.com/mobile-platforms.pdf', NOW(), NOW()),
(22, 'Android Basics', 'Dasar-dasar pengembangan Android', 'pdf', 'https://example.com/android-basics.pdf', NOW(), NOW()),
(22, 'Android Documentation', 'Dokumentasi resmi Android', 'link', 'https://developer.android.com/', NOW(), NOW()),
(23, 'UI/UX Mobile', 'Desain UI/UX untuk aplikasi mobile', 'pdf', 'https://example.com/mobile-uiux.pdf', NOW(), NOW()),
(23, 'Video: Mobile UI Patterns', 'Tutorial pola UI mobile', 'video', 'https://youtube.com/watch?v=mobile-ui-patterns', NOW(), NOW()),
(24, 'Mobile Testing', 'Testing aplikasi mobile', 'pdf', 'https://example.com/mobile-testing.pdf', NOW(), NOW()),
(24, 'Testing Tools', 'Tools untuk testing mobile', 'link', 'https://example.com/mobile-testing-tools', NOW(), NOW()),

-- KEAMJAR (course_id=7) - Sessions 25-28
(25, 'Cryptography Basics', 'Dasar-dasar kriptografi', 'pdf', 'https://example.com/cryptography-basics.pdf', NOW(), NOW()),
(25, 'Encryption Examples', 'Contoh implementasi enkripsi', 'pdf', 'https://example.com/encryption-examples.pdf', NOW(), NOW()),
(26, 'Firewall Configuration', 'Konfigurasi firewall', 'pdf', 'https://example.com/firewall-config.pdf', NOW(), NOW()),
(26, 'Video: Firewall Setup', 'Tutorial setup firewall', 'video', 'https://youtube.com/watch?v=firewall-setup', NOW(), NOW()),
(27, 'Network Attacks', 'Jenis-jenis serangan jaringan', 'pdf', 'https://example.com/network-attacks.pdf', NOW(), NOW()),
(27, 'Attack Prevention', 'Pencegahan serangan jaringan', 'link', 'https://example.com/attack-prevention', NOW(), NOW()),
(28, 'VPN Technologies', 'Teknologi VPN', 'pdf', 'https://example.com/vpn-technologies.pdf', NOW(), NOW()),
(28, 'VPN Implementation', 'Implementasi VPN', 'pdf', 'https://example.com/vpn-implementation.pdf', NOW(), NOW()),

-- ML (course_id=8) - Sessions 29-32
(29, 'ML Fundamentals', 'Fundamental machine learning', 'pdf', 'https://example.com/ml-fundamentals.pdf', NOW(), NOW()),
(29, 'ML Algorithms Overview', 'Gambaran umum algoritma ML', 'pdf', 'https://example.com/ml-algorithms.pdf', NOW(), NOW()),
(30, 'Supervised Learning', 'Pembelajaran terawasi', 'pdf', 'https://example.com/supervised-learning.pdf', NOW(), NOW()),
(30, 'Video: Regression', 'Tutorial regresi linear', 'video', 'https://youtube.com/watch?v=linear-regression', NOW(), NOW()),
(31, 'Unsupervised Learning', 'Pembelajaran tidak terawasi', 'pdf', 'https://example.com/unsupervised-learning.pdf', NOW(), NOW()),
(31, 'Clustering Examples', 'Contoh algoritma clustering', 'link', 'https://example.com/clustering-examples', NOW(), NOW()),
(32, 'Deep Learning', 'Deep learning dan neural networks', 'pdf', 'https://example.com/deep-learning.pdf', NOW(), NOW()),
(32, 'DL Frameworks', 'Framework deep learning', 'link', 'https://example.com/dl-frameworks', NOW(), NOW()),

-- CLOUD (course_id=9) - Sessions 33-36
(33, 'Cloud Computing Overview', 'Gambaran umum cloud computing', 'pdf', 'https://example.com/cloud-overview.pdf', NOW(), NOW()),
(33, 'Cloud Service Models', 'Model layanan cloud: IaaS, PaaS, SaaS', 'pdf', 'https://example.com/cloud-models.pdf', NOW(), NOW()),
(34, 'AWS Introduction', 'Pengantar Amazon Web Services', 'pdf', 'https://example.com/aws-intro.pdf', NOW(), NOW()),
(34, 'AWS Documentation', 'Dokumentasi resmi AWS', 'link', 'https://aws.amazon.com/documentation/', NOW(), NOW()),
(35, 'Containerization', 'Teknologi container: Docker', 'pdf', 'https://example.com/containerization.pdf', NOW(), NOW()),
(35, 'Video: Docker Tutorial', 'Tutorial lengkap Docker', 'video', 'https://youtube.com/watch?v=docker-tutorial', NOW(), NOW()),
(36, 'Kubernetes Basics', 'Dasar-dasar Kubernetes', 'pdf', 'https://example.com/kubernetes-basics.pdf', NOW(), NOW()),
(36, 'K8s Resources', 'Sumber belajar Kubernetes', 'link', 'https://example.com/k8s-resources', NOW(), NOW()),

-- PROAK (course_id=10) - Sessions 37-40
(37, 'Project Management', 'Manajemen proyek akhir', 'pdf', 'https://example.com/project-management.pdf', NOW(), NOW()),
(37, 'Project Planning', 'Perencanaan proyek', 'pdf', 'https://example.com/project-planning.pdf', NOW(), NOW()),
(38, 'Agile Methodology', 'Metodologi Agile dalam pengembangan', 'pdf', 'https://example.com/agile-methodology.pdf', NOW(), NOW()),
(38, 'Video: Scrum Framework', 'Tutorial Scrum framework', 'video', 'https://youtube.com/watch?v=scrum-framework', NOW(), NOW()),
(39, 'Testing Strategies', 'Strategi testing proyek', 'pdf', 'https://example.com/testing-strategies.pdf', NOW(), NOW()),
(39, 'Testing Tools', 'Tools untuk testing', 'link', 'https://example.com/testing-tools', NOW(), NOW()),
(40, 'Deployment Strategies', 'Strategi deployment', 'pdf', 'https://example.com/deployment-strategies.pdf', NOW(), NOW()),
(40, 'CI/CD Pipeline', 'Implementasi CI/CD pipeline', 'pdf', 'https://example.com/cicd-pipeline.pdf', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Update statistics
ANALYZE materials;
