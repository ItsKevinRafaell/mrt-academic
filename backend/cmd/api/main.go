package main

import (
	"log"
	"net/http"

	"mrt-backend/internal/config"
	httpDelivery "mrt-backend/internal/delivery/http"
	"mrt-backend/internal/repository/postgres"
)

func main() {
	cfg := config.Load()

	db, err := postgres.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	router := httpDelivery.NewRouter(cfg, db)
	router.Setup()

	log.Printf("Server starting on %s", cfg.ServerAddr())

	if err := http.ListenAndServe(cfg.ServerAddr(), router); err != nil {
		log.Fatal(err)
	}
}
