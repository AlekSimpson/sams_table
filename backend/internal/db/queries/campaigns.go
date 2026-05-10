package queries

import (
	"context"

	"sams_table/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const campaign_cols = "id, name, description, dm_id, created_at"

func scan_campaign(row interface{ Scan(...any) error }) (*models.Campaign, error) {
	c := &models.Campaign{}
	err := row.Scan(&c.ID, &c.Name, &c.Description, &c.DM_ID, &c.Created_At)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func List_Campaigns(ctx context.Context, database_pool *pgxpool.Pool, user_ID uuid.UUID) ([]models.Campaign, error) {
	rows, err := database_pool.Query(ctx,
		"SELECT "+campaign_cols+" FROM campaigns WHERE dm_id = $1",
		user_ID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var campaigns []models.Campaign
	for rows.Next() {
		c := models.Campaign{}
		if err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.DM_ID, &c.Created_At); err != nil {
			return nil, err
		}
		campaigns = append(campaigns, c)
	}
	return campaigns, rows.Err()
}

func Get_Campaign(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID) (*models.Campaign, error) {
	return scan_campaign(database_pool.QueryRow(ctx,
		"SELECT "+campaign_cols+" FROM campaigns WHERE id = $1",
		id,
	))
}

func Create_Campaign(ctx context.Context, database_pool *pgxpool.Pool, name string, description string, dm_ID uuid.UUID) (*models.Campaign, error) {
	return scan_campaign(database_pool.QueryRow(ctx,
		"INSERT INTO campaigns (name, description, dm_id) VALUES ($1, $2, $3) RETURNING "+campaign_cols,
		name, description, dm_ID,
	))
}

func Update_Campaign(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID, name string, description string) (*models.Campaign, error) {
	return scan_campaign(database_pool.QueryRow(ctx,
		"UPDATE campaigns SET name=$2, description=$3 WHERE id=$1 RETURNING "+campaign_cols,
		id, name, description,
	))
}

func Delete_Campaign(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID) error {
	_, err := database_pool.Exec(ctx, "DELETE FROM campaigns WHERE id=$1", id)
	return err
}
