package handlers

import (
	"net/http"
	"sams_table/internal/auth"
	"sams_table/internal/db/queries"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TODO: can't we just have a single action handler?
type ActionHandler struct {
	database_pool    *pgxpool.Pool
	webtoken_service *auth.JWTService
}

func New_ActionHandler(pool *pgxpool.Pool, webtoken_service *auth.JWTService) *AttackHandler {
	return &AttackHandler{database_pool: pool, webtoken_service: webtoken_service}
}

func (self *AttackHandler) List_Actions(response_writer http.ResponseWriter, request *http.Request) {
	attacks, err := queries.List_Attacks(request.Context(), self.database_pool)
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "Server error while listing attacks")
		return
	}
	write_json(response_writer, http.StatusOK, attacks)
}

func (self *AttackHandler) Get_Action(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "Found no id in request url")
		return
	}

	attack, err := queries.Get_Attack(request.Context(), self.database_pool, id)
	if err != nil {
		write_error(response_writer, http.StatusNotFound, "Could not find attack")
		return
	}
	write_json(response_writer, http.StatusOK, attack)
}
