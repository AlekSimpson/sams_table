package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"sams_table/internal/auth"
	"sams_table/internal/db"
	"sams_table/internal/handlers"
	"sams_table/internal/hub"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present (no-op in production containers where env is injected)
	_ = godotenv.Load()

	database_url := os.Getenv("DATABASE_URL")
	if database_url == "" {
		log.Fatal("DATABASE_URL is required")
	}
	webtoken_secret := os.Getenv("JWT_SECRET")
	if webtoken_secret == "" {
		log.Fatal("JWT_SECRET is required")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Run DB migrations
	if err := db.Run_Migrations(database_url); err != nil {
		log.Fatalf("migrations failed: %v", err)
	}

	// Connect pgxpool
	pool, err := db.Connect(context.Background(), database_url)
	if err != nil {
		log.Fatalf("db connect failed: %v", err)
	}
	defer pool.Close()

	// Init services
	webtoken_service := auth.New_JWT_Service(webtoken_secret)
	websocket_hub := hub.New_Hub()
	go websocket_hub.Run()

	// Init handlers
	auth_handler := handlers.New_Auth_Handler(pool, webtoken_service)
	campaign_handler := handlers.New_Campaign_Handler(pool, webtoken_service)
	character_handler := handlers.New_Character_Handler(pool, webtoken_service)
	map_handler := handlers.New_Map_Handler(pool, webtoken_service)
	attack_handler := handlers.New_AttackHandler(pool, webtoken_service)
	action_handler := handlers.New_ActionHandler(pool, webtoken_service)
	asset_handler := handlers.New_Asset_Handler(pool, webtoken_service)
	websocket_handler := handlers.New_WS_Handler(websocket_hub, webtoken_service, pool)
	rules_handler := handlers.New_Rules_Handler(pool)

	// Router
	router := chi.NewRouter()
	router.Use(chimiddleware.Logger)
	router.Use(chimiddleware.Recoverer)
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // TODO: restrict in production
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// Public auth routes
	router.Post("/api/auth/register", auth_handler.Register)
	router.Post("/api/auth/login", auth_handler.Login)
	router.Post("/api/auth/refresh", auth_handler.Refresh)

	// Public rules routes (read-only reference data)
	router.Get("/api/rules/classes", rules_handler.Get_Classes)
	router.Get("/api/rules/races", rules_handler.Get_Races)

	// Public asset serving (STL files are not sensitive)
	router.Get("/api/assets/{id}", asset_handler.Serve)

	// WebSocket (JWT passed as ?token= query param)
	router.Get("/ws", websocket_handler.Serve_websocket)

	// Protected routes
	router.Group(func(chi_router chi.Router) {
		chi_router.Use(auth.Middleware_Check_Token(webtoken_service))

		chi_router.Get("/api/actions/list", action_handler.List_Actions)
		chi_router.Get("/api/actions/get/{id}", action_handler.Get_Action)

		chi_router.Get("/api/attacks/{id}", attack_handler.Get_Attack)
		chi_router.Get("/api/attacks/list", attack_handler.List_Attacks)

		chi_router.Get("/api/campaigns", campaign_handler.List)
		chi_router.Post("/api/campaigns", campaign_handler.Create)
		chi_router.Get("/api/campaigns/{id}", campaign_handler.Get)
		chi_router.Put("/api/campaigns/{id}", campaign_handler.Update)
		chi_router.Delete("/api/campaigns/{id}", campaign_handler.Delete)
		chi_router.Get("/api/campaigns/{id}/characters", campaign_handler.List_Characters_By_Campaign)

		chi_router.Post("/api/users/{id}/create_character", character_handler.Create_Character)
		chi_router.Get("/api/users/{id}/characters", character_handler.Get_Characters_By_User)

		chi_router.Get("/api/characters/{id}", character_handler.Get)
		chi_router.Put("/api/characters/{id}", character_handler.Update)
		chi_router.Delete("/api/characters/{id}", character_handler.Delete)

		chi_router.Get("/api/maps", map_handler.List)
		chi_router.Post("/api/maps", map_handler.Create)
		chi_router.Get("/api/maps/{id}", map_handler.Get)
		chi_router.Put("/api/maps/{id}", map_handler.Update)
		chi_router.Delete("/api/maps/{id}", map_handler.Delete)
		chi_router.Get("/api/maps/{id}/tiles", map_handler.Get_Tiles)
		chi_router.Put("/api/maps/{id}/tiles", map_handler.Put_Tiles)

		chi_router.Post("/api/assets", asset_handler.Upload)
	})

	address := fmt.Sprintf(":%s", port)
	log.Printf("server listening on %s", address)
	if err := http.ListenAndServe(address, router); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
