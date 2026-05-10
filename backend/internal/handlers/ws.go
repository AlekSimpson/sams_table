package handlers

import (
	"net/http"

	"sams_table/internal/auth"
	"sams_table/internal/hub"

	"github.com/jackc/pgx/v5/pgxpool"
)

type WSHandler struct {
	hub              *hub.Hub
	webtoken_service *auth.JWTService
	database_pool    *pgxpool.Pool
}

func New_WS_Handler(h *hub.Hub, webtoken_service *auth.JWTService, database_pool *pgxpool.Pool) *WSHandler {
	return &WSHandler{hub: h, webtoken_service: webtoken_service, database_pool: database_pool}
}

// ServeWS handles GET /ws — upgrades the connection and registers the client with the hub.
func (self *WSHandler) Serve_websocket(response_writer http.ResponseWriter, request *http.Request) {
	token := request.URL.Query().Get("token")
	if token == "" {
		http.Error(response_writer, "missing token", http.StatusUnauthorized)
		return
	}

	claims, err := self.webtoken_service.Parse(token)
	if err != nil {
		http.Error(response_writer, "invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := hub.Upgrader.Upgrade(response_writer, request, nil)
	if err != nil {
		// Upgrader writes its own error response
		return
	}

	client := hub.New_Client(
		self.hub, conn,
		claims.User_ID,
		claims.Campaign_ID,
		claims.Role,
		claims.Character_ID,
	)

	self.hub.Register(client)

	go client.Write_Pump()
	go client.Read_Pump()
}
