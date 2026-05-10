package handlers

import (
	"encoding/json"
	"math/rand/v2"
	"net/http"

	"sams_table/internal/auth"
	"sams_table/internal/db/queries"
	"sams_table/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CharacterHandler struct {
	database_pool    *pgxpool.Pool
	webtoken_service *auth.JWTService
}

func New_Character_Handler(database_pool *pgxpool.Pool, webtoken_service *auth.JWTService) *CharacterHandler {
	return &CharacterHandler{database_pool: database_pool, webtoken_service: webtoken_service}
}

// Get handles GET /api/characters/{id}
func (self *CharacterHandler) Get(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid character id")
		return
	}

	character, err := queries.Get_Character(request.Context(), self.database_pool, id)
	if err != nil {
		write_error(response_writer, http.StatusNotFound, "character not found")
		return
	}
	write_json(response_writer, http.StatusOK, character)
}

// Get handles GET /api/users/{id}/characters
func (self *CharacterHandler) Get_Characters_By_User(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid character id")
		return
	}

	characters, err := queries.Get_Characters_By_User(request.Context(), self.database_pool, id)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to fetch characters")
		return
	}
	if characters == nil {
		characters = []models.Character{}
	}

	write_json(response_writer, http.StatusOK, characters)
}

// Update handles PUT /api/characters/{id}
func (self *CharacterHandler) Update(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid character id")
		return
	}

	var character models.Character
	if err := json.NewDecoder(request.Body).Decode(&character); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}
	character.ID = id

	updated, err := queries.Update_Character(request.Context(), self.database_pool, character)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to update character")
		return
	}

	write_json(response_writer, http.StatusOK, updated)
}

// Create_Character handles POST /api/users/{id}/create_character
func (self *CharacterHandler) Create_Character(response_writer http.ResponseWriter, request *http.Request) {
	player_id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid user id")
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid request body")
		return
	}

	classes, err := queries.List_Classes(request.Context(), self.database_pool)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to load character class list")
		return
	}
	class_selection_index := rand.IntN(len(classes))
	class := classes[class_selection_index]

	skills, err := queries.Get_Skills_For_Class(request.Context(), self.database_pool, &class)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to load skills list")
		return
	}
	skill_proficiencies := []string{}
	for range class.Max_Skill_Proficiency_Count {
		skill_proficiencies = append(skill_proficiencies, skills[rand.IntN(len(skills))].Stat)
	}

	races, err := queries.List_Races(request.Context(), self.database_pool)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to load character races list")
		return
	}
	race_selection_index := rand.IntN(len(races))
	race := races[race_selection_index]

	character_stats := models.CharacterStats{
		Str: Roll_New_Chararcter_Stat(),
		Dex: Roll_New_Chararcter_Stat(),
		Con: Roll_New_Chararcter_Stat(),
		Int: Roll_New_Chararcter_Stat(),
		Wis: Roll_New_Chararcter_Stat(),
		Cha: Roll_New_Chararcter_Stat(),
	}
	max_hp := Ability_Modifier(character_stats.Con) + class.Hit_Die

	character := models.Character{
		Player_ID:           &player_id,
		Campaign_ID:         nil,
		Name:                body.Name,
		Class:               class.Name,
		Race:                race.Name,
		Level:               1,
		MaxHP:               max_hp,
		Current_HP:          max_hp,
		Armor_Class:         10,
		Speed:               race.Base_Movement_Speed,
		Stats:               character_stats,
		Skill_Proficiencies: skill_proficiencies,
		Conditions:          []string{},
	}

	created, err := queries.Create_Character(request.Context(), self.database_pool, character)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to create character")
		return
	}

	write_json(response_writer, http.StatusCreated, created)
}

// Delete handles DELETE /api/characters/{id}
func (self *CharacterHandler) Delete(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid character id")
		return
	}

	if err := queries.Delete_Character(request.Context(), self.database_pool, id); err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to delete character")
		return
	}
	response_writer.WriteHeader(http.StatusNoContent)
}
