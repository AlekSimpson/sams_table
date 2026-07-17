package queries

import (
	"context"
	"sams_table/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const attack_cols = `id, name, range, dc, damage`

func List_Attacks(ctx context.Context, database *pgxpool.Pool) ([]models.Attack, error) {
	rows, err := database.Query(ctx, `SELECT `+attack_cols+` FROM attacks`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attacks []models.Attack
	for rows.Next() {
		attack := models.Attack{}
		if err := rows.Scan(&attack.Id, &attack.Name, &attack.Range, &attack.DC, &attack.Damage); err != nil {
			return nil, err
		}
		attacks = append(attacks, attack)
	}
	return attacks, rows.Err()
}

func Get_Attack(ctx context.Context, database *pgxpool.Pool, id uuid.UUID) (*models.Attack, error) {
	a := &models.Attack{}
	err := database.QueryRow(ctx, `SELECT `+attack_cols+` FROM attacks WHERE id = $1`, id).
		Scan(&a.Id, &a.Name, &a.Range, &a.DC, &a.Damage)
	if err != nil {
		return nil, err
	}
	return a, nil
}
