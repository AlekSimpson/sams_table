package handlers

import (
	"encoding/json"
	"net/http"

	"sams_table/internal/auth"
	"sams_table/internal/db/queries"
	"sams_table/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	database_pool    *pgxpool.Pool
	webtoken_service *auth.JWTService
}

func New_Auth_Handler(database_pool *pgxpool.Pool, webtoken_service *auth.JWTService) *AuthHandler {
	return &AuthHandler{database_pool: database_pool, webtoken_service: webtoken_service}
}

// Register handles POST /api/auth/register
func (self *AuthHandler) Register(response_writer http.ResponseWriter, request *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(request.Body).Decode(&req); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Password == "" {
		write_error(response_writer, http.StatusBadRequest, "username and password required")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "internal error")
		return
	}

	user, err := queries.Create_User(request.Context(), self.database_pool, req.Username, string(hash))
	if err != nil {
		write_error(response_writer, http.StatusConflict, "username already taken")
		return
	}

	token, err := self.webtoken_service.Sign(auth.JWTClaims{User_ID: user.ID.String()})
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "internal error")
		return
	}

	write_json(response_writer, http.StatusCreated, models.AuthResponse{Token: token, User: *user})
}

// Login handles POST /api/auth/login
func (self *AuthHandler) Login(response_writer http.ResponseWriter, request *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(request.Body).Decode(&req); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := queries.Get_User_By_Username(request.Context(), self.database_pool, req.Username)
	if err != nil {
		write_error(response_writer, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password_Hash), []byte(req.Password)); err != nil {
		write_error(response_writer, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := self.webtoken_service.Sign(auth.JWTClaims{User_ID: user.ID.String()})
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "internal error")
		return
	}

	write_json(response_writer, http.StatusOK, models.AuthResponse{Token: token, User: *user})
}

// Refresh handles POST /api/auth/refresh
func (self *AuthHandler) Refresh(response_writer http.ResponseWriter, request *http.Request) {
	write_not_implemented(response_writer)
}

// write_json sends a JSON response with the given status code.
func write_json(response_writer http.ResponseWriter, status int, value any) {
	response_writer.Header().Set("Content-Type", "application/json")
	response_writer.WriteHeader(status)
	json.NewEncoder(response_writer).Encode(value)
}

// write_error sends a JSON error response.
func write_error(response_writer http.ResponseWriter, status int, message string) {
	write_json(response_writer, status, models.ErrorResponse{Error: message})
}

// write_not_implemented sends a JSON 501 response.
func write_not_implemented(response_writer http.ResponseWriter) {
	write_json(response_writer, http.StatusNotImplemented, models.ErrorResponse{Error: "not implemented"})
}
