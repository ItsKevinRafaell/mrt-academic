package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

func main() {
	// Connect to database
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost port=5432 user=mrt password=secret dbname=mrt_db sslmode=disable"
	}

	var err error
	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	fmt.Println("🌱 Starting database seeding...")

	seedCawu()
	seedCourses()
	seedTopics()
	seedSessions()
	seedMaterials()
	seedTasks()

	fmt.Println("✅ Seeding completed!")
}

func seedCawu() {
	fmt.Println("📅 Seeding cawu...")

	cawuData := []struct {
		name     string
		year     int
		semester int
	}{
		{"Cawu 1", 2024, 1},
		{"Cawu 2", 2024, 2},
		{"Cawu 3", 2025, 1},
		{"Cawu 4", 2025, 2},
		{"Cawu 5", 2026, 1},
		{"Cawu 6", 2026, 2},
	}

	for _, c := range cawuData {
		var exists bool
		db.QueryRow("SELECT EXISTS(SELECT 1 FROM cawu WHERE name=$1 AND year=$2)", c.name, c.year).Scan(&exists)
		if !exists {
			_, err := db.Exec(
				"INSERT INTO cawu (name, year, semester) VALUES ($1, $2, $3)",
				c.name, c.year, c.semester,
			)
			if err != nil {
				log.Printf("Warning: Failed to insert cawu %s: %v", c.name, err)
			}
		}
	}
}

func seedCourses() {
	fmt.Println("📚 Seeding courses...")

	coursesData := []struct {
		code        string
		name        string
		sks         int
		description string
		cawuID      int
		instructors []string
	}{
		// Cawu 1 - Dasar
		{"CS101", "Algoritma dan Pemrograman", 4, "Dasar-dasar algoritma dan pemrograman dengan Python", 1, []string{"Dr. Andi Wijaya"}},
		{"MA101", "Matematika Diskrit", 3, "Logika, himpunan, graf, dan kombinatorika", 1, []string{"Prof. Budi Santoso"}},
		{"FI101", "Fisika Dasar", 3, "Mekanika, termodinamika, dan gelombang", 1, []string{"Dr. Citra Dewi"}},

		// Cawu 2 - Lanjutan Dasar
		{"CS201", "Struktur Data", 4, "Array, linked list, stack, queue, tree, dan graf", 2, []string{"Dr. Andi Wijaya", "Dr. Dedi Kurniawan"}},
		{"CS202", "Basis Data", 3, "Desain database, SQL, normalisasi, dan optimasi", 2, []string{"Dr. Eka Putri"}},
		{"MA201", "Aljabar Linear", 3, "Matriks, vektor, transformasi linear", 2, []string{"Prof. Budi Santoso"}},

		// Cawu 3 - Inti
		{"CS301", "Pemrograman Berorientasi Objek", 4, "OOP dengan Java, design patterns", 3, []string{"Dr. Fajar Rahman"}},
		{"CS302", "Jaringan Komputer", 3, "TCP/IP, protokol jaringan, keamanan jaringan", 3, []string{"Dr. Gina Sari"}},
		{"CS303", "Sistem Operasi", 3, "Proses, thread, memory management, file system", 3, []string{"Dr. Hadi Nugroho"}},

		// Cawu 4 - Lanjutan
		{"CS401", "Rekayasa Perangkat Lunak", 4, "SDLC, agile, testing, dan deployment", 4, []string{"Dr. Indah Lestari"}},
		{"CS402", "Kecerdasan Buatan", 3, "Machine learning, neural networks, deep learning", 4, []string{"Prof. Joko Susilo"}},
		{"CS403", "Keamanan Informasi", 3, "Kriptografi, keamanan jaringan, ethical hacking", 4, []string{"Dr. Gina Sari"}},

		// Cawu 5 - Spesialisasi
		{"CS501", "Pemrograman Web", 4, "HTML, CSS, JavaScript, React, Node.js", 5, []string{"Dr. Fajar Rahman"}},
		{"CS502", "Mobile Development", 3, "Android/iOS development dengan Flutter", 5, []string{"Dr. Dedi Kurniawan"}},
		{"CS503", "Cloud Computing", 3, "AWS, GCP, containerization dengan Docker", 5, []string{"Dr. Hadi Nugroho"}},

		// Cawu 6 - Proyek
		{"CS601", "Proyek Akhir", 6, "Pengembangan aplikasi lengkap dengan tim", 6, []string{"Dr. Indah Lestari", "Dr. Andi Wijaya"}},
		{"CS602", "Etika Profesi", 2, "Etika dalam teknologi informasi dan profesionalisme", 6, []string{"Prof. Budi Santoso"}},
	}

	for _, c := range coursesData {
		var exists bool
		db.QueryRow("SELECT EXISTS(SELECT 1 FROM courses WHERE code=$1)", c.code).Scan(&exists)
		if !exists {
			var courseID int
			err := db.QueryRow(
				"INSERT INTO courses (code, name, sks, description, cawu_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
				c.code, c.name, c.sks, c.description, c.cawuID,
			).Scan(&courseID)
			if err != nil {
				log.Printf("Warning: Failed to insert course %s: %v", c.code, err)
				continue
			}

			// Insert instructors
			for _, instructor := range c.instructors {
				_, err := db.Exec(
					"INSERT INTO course_instructors (course_id, instructor_name) VALUES ($1, $2)",
					courseID, instructor,
				)
				if err != nil {
					log.Printf("Warning: Failed to insert instructor for %s: %v", c.code, err)
				}
			}
		}
	}
}

func seedTopics() {
	fmt.Println("🏷️  Seeding topics...")

	topicsData := map[string][]struct {
		title       string
		description string
		orderNum    int
	}{
		"CS101": {
			{title: "Pengenalan Python", description: "Dasar-dasar bahasa pemrograman Python", orderNum: 1},
			{title: "Struktur Kontrol", description: "If-else, loop, dan fungsi", orderNum: 2},
			{title: "List dan Dictionary", description: "Struktur data dasar di Python", orderNum: 3},
			{title: "File I/O", description: "Membaca dan menulis file", orderNum: 4},
		},
		"CS201": {
			{title: "Array dan Linked List", description: "Struktur data linear", orderNum: 1},
			{title: "Stack dan Queue", description: "LIFO dan FIFO structures", orderNum: 2},
			{title: "Tree", description: "Binary tree, BST, AVL tree", orderNum: 3},
			{title: "Graph", description: "Representasi dan traversal graf", orderNum: 4},
			{title: "Hashing", description: "Hash table dan collision resolution", orderNum: 5},
		},
		"CS301": {
			{title: "Konsep OOP", description: "Class, object, encapsulation", orderNum: 1},
			{title: "Inheritance", description: "Pewarisan dan polymorphism", orderNum: 2},
			{title: "Design Patterns", description: "Singleton, Factory, Observer", orderNum: 3},
			{title: "SOLID Principles", description: "5 prinsip desain OOP", orderNum: 4},
		},
		"CS401": {
			{title: "SDLC", description: "Waterfall, Agile, Scrum", orderNum: 1},
			{title: "Requirements Engineering", description: "Analisis dan spesifikasi kebutuhan", orderNum: 2},
			{title: "Software Testing", description: "Unit test, integration test, UAT", orderNum: 3},
			{title: "Deployment", description: "CI/CD, containerization, monitoring", orderNum: 4},
		},
		"CS501": {
			{title: "HTML & CSS", description: "Struktur dan styling web", orderNum: 1},
			{title: "JavaScript", description: "ES6+, DOM manipulation, async", orderNum: 2},
			{title: "React", description: "Components, hooks, state management", orderNum: 3},
			{title: "Backend dengan Node.js", description: "Express, REST API, database", orderNum: 4},
		},
	}

	for courseCode, topics := range topicsData {
		var courseID int
		err := db.QueryRow("SELECT id FROM courses WHERE code=$1", courseCode).Scan(&courseID)
		if err != nil {
			log.Printf("Warning: Course %s not found", courseCode)
			continue
		}

		for _, t := range topics {
			var exists bool
			db.QueryRow("SELECT EXISTS(SELECT 1 FROM topics WHERE course_id=$1 AND title=$2)", courseID, t.title).Scan(&exists)
			if !exists {
				_, err := db.Exec(
					"INSERT INTO topics (course_id, title, description, order_number) VALUES ($1, $2, $3, $4)",
					courseID, t.title, t.description, t.orderNum,
				)
				if err != nil {
					log.Printf("Warning: Failed to insert topic %s for %s: %v", t.title, courseCode, err)
				}
			}
		}
	}
}

func seedSessions() {
	fmt.Println("📖 Seeding sessions...")

	sessionsData := map[string]map[string][]struct {
		number      int
		title       string
		description string
	}{
		"CS101": {
			"Pengenalan Python": {
				{1, "Instalasi Python", "Setup environment Python"},
				{2, "Hello World", "Program pertama dengan Python"},
				{3, "Variabel dan Tipe Data", "String, integer, float, boolean"},
			},
			"Struktur Kontrol": {
				{4, "Percabangan", "If, elif, else statements"},
				{5, "Perulangan", "For loop dan while loop"},
				{6, "Fungsi", "Definisi dan pemanggilan fungsi"},
			},
		},
		"CS201": {
			"Array dan Linked List": {
				{1, "Array Basics", "Deklarasi dan operasi array"},
				{2, "Singly Linked List", "Implementasi linked list"},
				{3, "Doubly Linked List", "Linked list dua arah"},
			},
			"Stack dan Queue": {
				{4, "Stack Implementation", "LIFO dengan array dan linked list"},
				{5, "Queue Implementation", "FIFO dan circular queue"},
				{6, "Aplikasi Stack & Queue", "Infix to postfix, BFS"},
			},
		},
		"CS301": {
			"Konsep OOP": {
				{1, "Class dan Object", "Membuat class dan instance"},
				{2, "Encapsulation", "Access modifiers dan getter/setter"},
			},
			"Inheritance": {
				{3, "Inheritance Basics", "Parent dan child class"},
				{4, "Polymorphism", "Method overriding dan overloading"},
			},
		},
	}

	for courseCode, topicSessions := range sessionsData {
		var courseID int
		err := db.QueryRow("SELECT id FROM courses WHERE code=$1", courseCode).Scan(&courseID)
		if err != nil {
			log.Printf("Warning: Course %s not found", courseCode)
			continue
		}

		for topicName, sessions := range topicSessions {
			var topicID int
			err := db.QueryRow("SELECT id FROM topics WHERE course_id=$1 AND title=$2", courseID, topicName).Scan(&topicID)
			if err != nil {
				log.Printf("Warning: Topic %s not found for %s", topicName, courseCode)
				continue
			}

			for _, s := range sessions {
				var exists bool
				db.QueryRow("SELECT EXISTS(SELECT 1 FROM sessions WHERE course_id=$1 AND number=$2)", courseID, s.number).Scan(&exists)
				if !exists {
					_, err := db.Exec(
						"INSERT INTO sessions (course_id, topic_id, number, title, description) VALUES ($1, $2, $3, $4, $5)",
						courseID, topicID, s.number, s.title, s.description,
					)
					if err != nil {
						log.Printf("Warning: Failed to insert session %d for %s: %v", s.number, courseCode, err)
					}
				}
			}
		}
	}
}

func seedMaterials() {
	fmt.Println("📄 Seeding materials...")

	materialsData := map[string]map[int][]struct {
		title       string
		description string
		matType     string
		url         string
	}{
		"CS101": {
			1: { // Pengenalan Python
				{"Slide Python Basics", "Presentasi dasar-dasar Python", "pdf", "https://example.com/python-basics.pdf"},
				{"Video Tutorial Instalasi", "Cara install Python di Windows/Mac/Linux", "video", "https://youtube.com/watch?v=python-install"},
				{"Latihan 1", "Soal latihan variabel dan tipe data", "pdf", "https://example.com/latihan1.pdf"},
			},
			2: { // Struktur Kontrol
				{"Slide Control Flow", "If-else dan loop", "pdf", "https://example.com/control-flow.pdf"},
				{"Code Examples", "Contoh kode struktur kontrol", "link", "https://github.com/example/python-control"},
			},
		},
		"CS201": {
			1: { // Array dan Linked List
				{"Slide Array", "Konsep dan implementasi array", "pdf", "https://example.com/array.pdf"},
				{"Slide Linked List", "Struktur linked list", "pdf", "https://example.com/linkedlist.pdf"},
				{"Video Linked List", "Visualisasi linked list", "video", "https://youtube.com/watch?v=linkedlist"},
			},
			4: { // Stack dan Queue
				{"Slide Stack", "Konsep LIFO dan implementasi", "pdf", "https://example.com/stack.pdf"},
				{"Slide Queue", "Konsep FIFO dan implementasi", "pdf", "https://example.com/queue.pdf"},
			},
		},
	}

	for courseCode, sessionMaterials := range materialsData {
		var courseID int
		err := db.QueryRow("SELECT id FROM courses WHERE code=$1", courseCode).Scan(&courseID)
		if err != nil {
			log.Printf("Warning: Course %s not found", courseCode)
			continue
		}

		for sessionNum, materials := range sessionMaterials {
			var sessionID int
			err := db.QueryRow("SELECT id FROM sessions WHERE course_id=$1 AND number=$2", courseID, sessionNum).Scan(&sessionID)
			if err != nil {
				log.Printf("Warning: Session %d not found for %s", sessionNum, courseCode)
				continue
			}

			for _, m := range materials {
				var exists bool
				db.QueryRow("SELECT EXISTS(SELECT 1 FROM materials WHERE session_id=$1 AND title=$2)", sessionID, m.title).Scan(&exists)
				if !exists {
					_, err := db.Exec(
						"INSERT INTO materials (session_id, title, description, type, url) VALUES ($1, $2, $3, $4, $5)",
						sessionID, m.title, m.description, m.matType, m.url,
					)
					if err != nil {
						log.Printf("Warning: Failed to insert material %s for %s: %v", m.title, courseCode, err)
					}
				}
			}
		}
	}
}

func seedTasks() {
	fmt.Println("✅ Seeding tasks...")

	tasksData := map[string][]struct {
		title       string
		description string
		deadline    time.Time
		taskType    string
		maxScore    int
	}{
		"CS101": {
			{"Tugas 1: Hello World", "Buat program Hello World dengan Python", time.Now().Add(7 * 24 * time.Hour), "assignment", 100},
			{"Tugas 2: Kalkulator", "Buat kalkulator sederhana", time.Now().Add(14 * 24 * time.Hour), "assignment", 100},
			{"Quiz 1: Dasar Python", "Quiz tentang variabel dan tipe data", time.Now().Add(21 * 24 * time.Hour), "quiz", 50},
		},
		"CS201": {
			{"Tugas 1: Implementasi Linked List", "Implementasi singly linked list", time.Now().Add(10 * 24 * time.Hour), "assignment", 100},
			{"Tugas 2: Stack & Queue", "Implementasi stack dan queue", time.Now().Add(20 * 24 * time.Hour), "assignment", 100},
			{"Project: Aplikasi Antrian", "Buat aplikasi antrian dengan queue", time.Now().Add(30 * 24 * time.Hour), "project", 150},
		},
		"CS301": {
			{"Tugas 1: Class Mahasiswa", "Buat class Mahasiswa dengan encapsulation", time.Now().Add(7 * 24 * time.Hour), "assignment", 100},
			{"Tugas 2: Inheritance Hierarchy", "Buat hierarki class kendaraan", time.Now().Add(14 * 24 * time.Hour), "assignment", 100},
		},
		"CS401": {
			{"Tugas 1: Requirements Document", "Buat SRS untuk aplikasi perpustakaan", time.Now().Add(14 * 24 * time.Hour), "assignment", 100},
			{"Tugas 2: Test Plan", "Buat test plan dan test cases", time.Now().Add(21 * 24 * time.Hour), "assignment", 100},
		},
		"CS501": {
			{"Tugas 1: Static Website", "Buat website portfolio dengan HTML/CSS", time.Now().Add(10 * 24 * time.Hour), "assignment", 100},
			{"Tugas 2: React App", "Buat aplikasi todo list dengan React", time.Now().Add(21 * 24 * time.Hour), "assignment", 150},
			{"Project: Full Stack App", "Buat aplikasi web lengkap dengan backend", time.Now().Add(45 * 24 * time.Hour), "project", 200},
		},
	}

	for courseCode, tasks := range tasksData {
		var courseID int
		err := db.QueryRow("SELECT id FROM courses WHERE code=$1", courseCode).Scan(&courseID)
		if err != nil {
			log.Printf("Warning: Course %s not found", courseCode)
			continue
		}

		for _, t := range tasks {
			var exists bool
			db.QueryRow("SELECT EXISTS(SELECT 1 FROM tasks WHERE course_id=$1 AND title=$2)", courseID, t.title).Scan(&exists)
			if !exists {
				_, err := db.Exec(
					"INSERT INTO tasks (course_id, title, description, deadline, type, max_score) VALUES ($1, $2, $3, $4, $5, $6)",
					courseID, t.title, t.description, t.deadline, t.taskType, t.maxScore,
				)
				if err != nil {
					log.Printf("Warning: Failed to insert task %s for %s: %v", t.title, courseCode, err)
				}
			}
		}
	}
}
