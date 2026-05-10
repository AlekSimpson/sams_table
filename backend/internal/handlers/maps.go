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

type MapHandler struct {
	database_pool    *pgxpool.Pool
	webtoken_service *auth.JWTService
}

func New_Map_Handler(database_pool *pgxpool.Pool, webtoken_service *auth.JWTService) *MapHandler {
	return &MapHandler{database_pool: database_pool, webtoken_service: webtoken_service}
}

// List handles GET /api/maps
func (self *MapHandler) List(response_writer http.ResponseWriter, request *http.Request) {
	claims := auth.Get_Claims_From_Context(request.Context())
	campaign_id, err := uuid.Parse(claims.Campaign_ID)
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "campaign id missing from token")
		return
	}

	maps, err := queries.List_Maps_By_Campaign(request.Context(), self.database_pool, campaign_id)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to list maps")
		return
	}
	if maps == nil {
		maps = []models.Map{}
	}
	write_json(response_writer, http.StatusOK, maps)
}

// Create handles POST /api/maps
func (self *MapHandler) Create(response_writer http.ResponseWriter, request *http.Request) {
	claims := auth.Get_Claims_From_Context(request.Context())
	campaign_id, err := uuid.Parse(claims.Campaign_ID)
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "campaign id missing from token")
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Name == "" {
		write_error(response_writer, http.StatusBadRequest, "name is required")
		return
	}

	m, err := queries.Create_Map(request.Context(), self.database_pool, campaign_id, body.Name)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to create map")
		return
	}
	write_json(response_writer, http.StatusCreated, m)
}

// Get handles GET /api/maps/{id}
func (self *MapHandler) Get(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid map id")
		return
	}

	m, err := queries.Get_Map(request.Context(), self.database_pool, id)
	if err != nil {
		write_error(response_writer, http.StatusNotFound, "map not found")
		return
	}
	write_json(response_writer, http.StatusOK, m)
}

// Update handles PUT /api/maps/{id}
func (self *MapHandler) Update(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid map id")
		return
	}

	var body struct {
		Name        string `json:"name"`
		Grid_Width  int    `json:"grid_width"`
		Grid_Height int    `json:"grid_height"`
	}
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}

	m, err := queries.Update_Map(request.Context(), self.database_pool, id, body.Name, body.Grid_Width, body.Grid_Height)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to update map")
		return
	}
	write_json(response_writer, http.StatusOK, m)
}

// Delete handles DELETE /api/maps/{id}
func (self *MapHandler) Delete(response_writer http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid map id")
		return
	}

	if err := queries.Delete_Map(r.Context(), self.database_pool, id); err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to delete map")
		return
	}
	response_writer.WriteHeader(http.StatusNoContent)
}

// GetTiles handles GET /api/maps/{id}/tiles
func (self *MapHandler) Get_Tiles(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid map id")
		return
	}

	tiles, err := queries.List_Tiles_By_Map(request.Context(), self.database_pool, id)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to list tiles")
		return
	}
	if tiles == nil {
		tiles = []models.MapTile{}
	}
	write_json(response_writer, http.StatusOK, tiles)
}

// PutTiles handles PUT /api/maps/{id}/tiles
func (self *MapHandler) Put_Tiles(response_writer http.ResponseWriter, request *http.Request) {
	map_id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid map id")
		return
	}

	var tiles []models.MapTile
	if err := json.NewDecoder(request.Body).Decode(&tiles); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}

	result := make([]models.MapTile, 0, len(tiles))
	for _, tile := range tiles {
		tile.Map_ID = map_id
		upserted, err := queries.Upsert_Tile(request.Context(), self.database_pool, tile)
		if err != nil {
			write_error(response_writer, http.StatusInternalServerError, "failed to upsert tile")
			return
		}
		result = append(result, *upserted)
	}
	write_json(response_writer, http.StatusOK, result)
}
