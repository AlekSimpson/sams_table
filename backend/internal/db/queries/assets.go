package queries

import (
	"context"

	"sams_table/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const asset_cols = "id, campaign_id, uploaded_by, label, storage_path, grid_width, grid_depth, scale_factor, asset_type, created_at"

func scan_asset(row interface{ Scan(...any) error }) (*models.UploadedAsset, error) {
	a := &models.UploadedAsset{}
	err := row.Scan(
		&a.ID, &a.Campaign_ID, &a.Uploaded_By, &a.Label,
		&a.Storage_Path, &a.Grid_Width, &a.Grid_Depth, &a.Scale_Factor,
		&a.Asset_Type, &a.Created_At,
	)
	if err != nil {
		return nil, err
	}
	return a, nil
}

func Create_Asset(ctx context.Context, database_pool *pgxpool.Pool, asset models.UploadedAsset) (*models.UploadedAsset, error) {
	return scan_asset(database_pool.QueryRow(ctx,
		`INSERT INTO uploaded_assets (campaign_id, uploaded_by, label, storage_path, grid_width, grid_depth, scale_factor, asset_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING `+asset_cols,
		asset.Campaign_ID, asset.Uploaded_By, asset.Label, asset.Storage_Path,
		asset.Grid_Width, asset.Grid_Depth, asset.Scale_Factor, asset.Asset_Type,
	))
}

func Get_Asset(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID) (*models.UploadedAsset, error) {
	return scan_asset(database_pool.QueryRow(ctx,
		"SELECT "+asset_cols+" FROM uploaded_assets WHERE id=$1",
		id,
	))
}

func List_Assets_By_Campaign(ctx context.Context, database_pool *pgxpool.Pool, campaign_ID uuid.UUID) ([]models.UploadedAsset, error) {
	rows, err := database_pool.Query(ctx,
		"SELECT "+asset_cols+" FROM uploaded_assets WHERE campaign_id=$1",
		campaign_ID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assets []models.UploadedAsset
	for rows.Next() {
		a := models.UploadedAsset{}
		if err := rows.Scan(
			&a.ID, &a.Campaign_ID, &a.Uploaded_By, &a.Label,
			&a.Storage_Path, &a.Grid_Width, &a.Grid_Depth, &a.Scale_Factor,
			&a.Asset_Type, &a.Created_At,
		); err != nil {
			return nil, err
		}
		assets = append(assets, a)
	}
	return assets, rows.Err()
}
