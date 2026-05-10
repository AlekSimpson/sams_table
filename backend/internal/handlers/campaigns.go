package handlers

import (
	"encoding/json"
	"net/http"

	"sams_table/internal/auth"
	"sams_table/internal/db/queries"
	"sams_table/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CampaignHandler struct {
	database_pool    *pgxpool.Pool
	webtoken_service *auth.JWTService
}

func New_Campaign_Handler(database_pool *pgxpool.Pool, webtoken_service *auth.JWTService) *CampaignHandler {
	return &CampaignHandler{database_pool: database_pool, webtoken_service: webtoken_service}
}

// List handles GET /api/campaigns
func (self *CampaignHandler) List(response_writer http.ResponseWriter, request *http.Request) {
	claims := auth.Get_Claims_From_Context(request.Context())
	user_id, err := uuid.Parse(claims.User_ID)
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid user id in token")
		return
	}

	campaigns, err := queries.List_Campaigns(request.Context(), self.database_pool, user_id)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to list campaigns")
		return
	}
	if campaigns == nil {
		campaigns = []models.Campaign{}
	}
	write_json(response_writer, http.StatusOK, campaigns)
}

// Create handles POST /api/campaigns
func (self *CampaignHandler) Create(response_writer http.ResponseWriter, request *http.Request) {
	claims := auth.Get_Claims_From_Context(request.Context())
	user_id, err := uuid.Parse(claims.User_ID)
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid user id in token")
		return
	}

	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Name == "" {
		write_error(response_writer, http.StatusBadRequest, "name is required")
		return
	}

	campaign, err := queries.Create_Campaign(request.Context(), self.database_pool, body.Name, body.Description, user_id)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to create campaign")
		return
	}
	write_json(response_writer, http.StatusCreated, campaign)
}

// Get handles GET /api/campaigns/{id}
func (self *CampaignHandler) Get(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid campaign id")
		return
	}

	campaign, err := queries.Get_Campaign(request.Context(), self.database_pool, id)
	if err != nil {
		write_error(response_writer, http.StatusNotFound, "campaign not found")
		return
	}
	write_json(response_writer, http.StatusOK, campaign)
}

// Update handles PUT /api/campaigns/{id}
func (self *CampaignHandler) Update(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid campaign id")
		return
	}

	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}

	campaign, err := queries.Update_Campaign(request.Context(), self.database_pool, id, body.Name, body.Description)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to update campaign")
		return
	}
	write_json(response_writer, http.StatusOK, campaign)
}

// Delete handles DELETE /api/campaigns/{id}
func (self *CampaignHandler) Delete(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid campaign id")
		return
	}

	if err := queries.Delete_Campaign(request.Context(), self.database_pool, id); err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to delete campaign")
		return
	}
	response_writer.WriteHeader(http.StatusNoContent)
}

// ListCharacters handles GET /api/campaigns/{id}/characters
func (self *CampaignHandler) List_Characters_By_Campaign(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid campaign id")
		return
	}

	characters, err := queries.List_Characters_By_Campaign(request.Context(), self.database_pool, id)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to list characters")
		return
	}
	if characters == nil {
		characters = []models.Character{}
	}
	write_json(response_writer, http.StatusOK, characters)
}
