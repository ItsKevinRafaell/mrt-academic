package main

import (
	"fmt"
	"os"

	"mrt-backend/internal/config"
	"mrt-backend/internal/repository/postgres"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: promote-admin <email>")
		fmt.Println("Example: promote-admin admin@test.com")
		os.Exit(1)
	}

	email := os.Args[1]

	cfg := config.Load()
	db, err := postgres.NewConnection(cfg.DatabaseURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Database connection failed: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	query := `
		UPDATE user_roles
		SET role = 'super_admin'
		WHERE user_id = (SELECT id FROM users WHERE email = $1)
		AND role = 'mahasiswa'
	`

	result, err := db.Exec(query, email)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Update failed: %v\n", err)
		os.Exit(1)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to check affected rows: %v\n", err)
		os.Exit(1)
	}

	if rows == 0 {
		fmt.Printf("No user found with email '%s' who is currently 'mahasiswa'\n", email)
		os.Exit(1)
	}

	fmt.Printf("✓ User '%s' promoted to super_admin\n", email)
}
