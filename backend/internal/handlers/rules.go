package handlers

import (
	"net/http"

	"sams_table/internal/db/queries"
	"sams_table/internal/models"

	"math"
	"math/rand/v2"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Ability_Modifier(ability int) int {
	return int(math.Floor(float64((ability - 10) / 2)))
}

func Roll_Dice(dice_number int, amount int) int {
	total := 0
	for range amount {
		total += rand.IntN(dice_number) + 1
	}
	return total
}

func Roll_New_Chararcter_Stat() int {
	stat := 0
	lowest := 10000
	for range 4 {
		roll := Roll_Dice(6, 1)
		if roll < lowest {
			lowest = roll
		}

		stat += roll
	}

	stat -= lowest
	return stat
}

type RulesHandler struct {
	pool *pgxpool.Pool
}

func New_Rules_Handler(pool *pgxpool.Pool) *RulesHandler {
	return &RulesHandler{pool: pool}
}

// Get_Classes handles GET /api/rules/classes
func (self *RulesHandler) Get_Classes(writer http.ResponseWriter, request *http.Request) {
	classes, err := queries.List_Classes(request.Context(), self.pool)
	if err != nil {
		write_error(writer, http.StatusInternalServerError, "failed to fetch classes")
		return
	}
	if classes == nil {
		classes = []models.Class{}
	}
	write_json(writer, http.StatusOK, classes)
}

// Get_Races handles GET /api/rules/races
func (self *RulesHandler) Get_Races(writer http.ResponseWriter, request *http.Request) {
	races, err := queries.List_Races(request.Context(), self.pool)
	if err != nil {
		write_error(writer, http.StatusInternalServerError, "failed to fetch races")
		return
	}
	if races == nil {
		races = []models.Race{}
	}
	write_json(writer, http.StatusOK, races)
}
