package db

import (
	"context"
	"database/sql"
	"embed"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var Embed_Migrations embed.FS

// Connect returns a pgxpool connection pool for the given DSN.
func Connect(context context.Context, database_url string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(context, database_url)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(context); err != nil {
		return nil, err
	}
	return pool, nil
}

// RunMigrations runs all pending goose migrations against the database.
func Run_Migrations(database_url string) error {
	database, err := sql.Open("pgx", database_url)
	if err != nil {
		return err
	}
	defer database.Close()

	goose.SetBaseFS(Embed_Migrations)
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Up(database, "migrations")
}
