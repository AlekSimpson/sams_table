package queries

import (
	"context"
	"sams_table/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

func List_Actions(context context.Context, database *pgxpool.Pool) ([]models.Action, error) {
	rows, err := database.Query(context, `SELECT * FROM actions`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var actions []models.Action
	for rows.Next() {
		var action models.Action
		if err := rows.Scan(&action.Id, &action.Name, &action.Description); err != nil {
			return nil, err
		}

		actions = append(actions, action)
	}
	return actions, nil
}

func Get_Action(context context.Context, database *pgxpool.Pool, id string) (*models.Action, error) {
	rows, err := database.Query(context, `SELECT * FROM actions WHERE id = $1`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var action models.Action
	if err := rows.Scan(&action.Id, &action.Name, &action.Description); err != nil {
		return nil, err
	}
	return &action, nil
}
