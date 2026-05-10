package queries

import (
	"context"

	"sams_table/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Get_User_By_ID(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := database_pool.QueryRow(ctx,
		"SELECT id, username, password_hash, created_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Username, &user.Password_Hash, &user.Created_At)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func Get_User_By_Username(ctx context.Context, database_pool *pgxpool.Pool, username string) (*models.User, error) {
	user := &models.User{}
	err := database_pool.QueryRow(ctx,
		"SELECT id, username, password_hash, created_at FROM users WHERE username = $1",
		username,
	).Scan(&user.ID, &user.Username, &user.Password_Hash, &user.Created_At)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func Create_User(ctx context.Context, database_pool *pgxpool.Pool, username string, password_hash string) (*models.User, error) {
	user := &models.User{}
	err := database_pool.QueryRow(ctx,
		"INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, password_hash, created_at",
		username, password_hash,
	).Scan(&user.ID, &user.Username, &user.Password_Hash, &user.Created_At)
	if err != nil {
		return nil, err
	}
	return user, nil
}
