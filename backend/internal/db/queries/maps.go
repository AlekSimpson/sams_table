package queries

import (
	"context"

	"sams_table/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const map_cols = "id, campaign_id, name, grid_width, grid_height, created_at"
const tile_cols = "id, map_id, asset_id, asset_source, grid_x, grid_y, grid_z, rotation_y"

func scan_map(row interface{ Scan(...any) error }) (*models.Map, error) {
	m := &models.Map{}
	err := row.Scan(&m.ID, &m.Campaign_ID, &m.Name, &m.Grid_Width, &m.Grid_Height, &m.Created_At)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func scan_tile(row interface{ Scan(...any) error }) (*models.MapTile, error) {
	t := &models.MapTile{}
	err := row.Scan(&t.ID, &t.Map_ID, &t.Asset_ID, &t.Asset_Source, &t.Grid_X, &t.Grid_Y, &t.Grid_Z, &t.Rotation_Y)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func List_Maps_By_Campaign(ctx context.Context, database_pool *pgxpool.Pool, campaign_ID uuid.UUID) ([]models.Map, error) {
	rows, err := database_pool.Query(ctx,
		"SELECT "+map_cols+" FROM maps WHERE campaign_id = $1",
		campaign_ID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var maps []models.Map
	for rows.Next() {
		m := models.Map{}
		if err := rows.Scan(&m.ID, &m.Campaign_ID, &m.Name, &m.Grid_Width, &m.Grid_Height, &m.Created_At); err != nil {
			return nil, err
		}
		maps = append(maps, m)
	}
	return maps, rows.Err()
}

func Get_Map(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID) (*models.Map, error) {
	return scan_map(database_pool.QueryRow(ctx,
		"SELECT "+map_cols+" FROM maps WHERE id = $1",
		id,
	))
}

func Create_Map(ctx context.Context, database_pool *pgxpool.Pool, campaign_ID uuid.UUID, name string) (*models.Map, error) {
	return scan_map(database_pool.QueryRow(ctx,
		"INSERT INTO maps (campaign_id, name) VALUES ($1, $2) RETURNING "+map_cols,
		campaign_ID, name,
	))
}

func Update_Map(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID, name string, grid_width int, grid_height int) (*models.Map, error) {
	return scan_map(database_pool.QueryRow(ctx,
		"UPDATE maps SET name=$2, grid_width=$3, grid_height=$4 WHERE id=$1 RETURNING "+map_cols,
		id, name, grid_width, grid_height,
	))
}

func Delete_Map(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID) error {
	_, err := database_pool.Exec(ctx, "DELETE FROM maps WHERE id=$1", id)
	return err
}

func List_Tiles_By_Map(ctx context.Context, database_pool *pgxpool.Pool, map_ID uuid.UUID) ([]models.MapTile, error) {
	rows, err := database_pool.Query(ctx,
		"SELECT "+tile_cols+" FROM map_tiles WHERE map_id = $1",
		map_ID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tiles []models.MapTile
	for rows.Next() {
		t := models.MapTile{}
		if err := rows.Scan(&t.ID, &t.Map_ID, &t.Asset_ID, &t.Asset_Source, &t.Grid_X, &t.Grid_Y, &t.Grid_Z, &t.Rotation_Y); err != nil {
			return nil, err
		}
		tiles = append(tiles, t)
	}
	return tiles, rows.Err()
}

func Upsert_Tile(ctx context.Context, database_pool *pgxpool.Pool, tile models.MapTile) (*models.MapTile, error) {
	return scan_tile(database_pool.QueryRow(ctx,
		`INSERT INTO map_tiles (id, map_id, asset_id, asset_source, grid_x, grid_y, grid_z, rotation_y)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (map_id, grid_x, grid_y, grid_z) DO UPDATE SET
			asset_id     = EXCLUDED.asset_id,
			asset_source = EXCLUDED.asset_source,
			rotation_y   = EXCLUDED.rotation_y
		RETURNING `+tile_cols,
		tile.Map_ID, tile.Asset_ID, tile.Asset_Source,
		tile.Grid_X, tile.Grid_Y, tile.Grid_Z, tile.Rotation_Y,
	))
}

func Delete_Tile(ctx context.Context, database_pool *pgxpool.Pool, tile_ID uuid.UUID) error {
	_, err := database_pool.Exec(ctx, "DELETE FROM map_tiles WHERE id=$1", tile_ID)
	return err
}
