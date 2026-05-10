package queries

import (
	"context"

	"sams_table/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const character_cols = `id, campaign_id, player_id, name, class, race, level,
	max_hp, current_hp, armor_class, speed, stats, skill_profs, conditions, created_at`

func scan_character(row interface{ Scan(...any) error }) (*models.Character, error) {
	c := &models.Character{}
	err := row.Scan(
		&c.ID, &c.Campaign_ID, &c.Player_ID, &c.Name, &c.Class, &c.Race, &c.Level,
		&c.MaxHP, &c.Current_HP, &c.Armor_Class, &c.Speed,
		&c.Stats, &c.Skill_Proficiencies, &c.Conditions, &c.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func List_Characters_By_Campaign(ctx context.Context, database_pool *pgxpool.Pool, campaign_ID uuid.UUID) ([]models.Character, error) {
	rows, err := database_pool.Query(ctx,
		"SELECT "+character_cols+" FROM characters WHERE campaign_id = $1",
		campaign_ID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var characters []models.Character
	for rows.Next() {
		c := models.Character{}
		if err := rows.Scan(
			&c.ID, &c.Campaign_ID, &c.Player_ID, &c.Name, &c.Class, &c.Race, &c.Level,
			&c.MaxHP, &c.Current_HP, &c.Armor_Class, &c.Speed,
			&c.Stats, &c.Skill_Proficiencies, &c.Conditions, &c.CreatedAt,
		); err != nil {
			return nil, err
		}
		characters = append(characters, c)
	}
	return characters, rows.Err()
}

func Get_Character(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID) (*models.Character, error) {
	return scan_character(database_pool.QueryRow(ctx,
		"SELECT "+character_cols+" FROM characters WHERE id = $1",
		id,
	))
}

func Get_Characters_By_User(context context.Context, database_pool *pgxpool.Pool, user_id uuid.UUID) ([]models.Character, error) {
	rows, err := database_pool.Query(context,
		"select "+character_cols+" from characters where player_id = $1",
		user_id,
	)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var characters []models.Character
	for rows.Next() {
		character := models.Character{}
		if err := rows.Scan(
			&character.ID, &character.Campaign_ID, &character.Player_ID, &character.Name, &character.Class, &character.Race, &character.Level,
			&character.MaxHP, &character.Current_HP, &character.Armor_Class, &character.Speed,
			&character.Stats, &character.Skill_Proficiencies, &character.Conditions, &character.CreatedAt,
		); err != nil {
			return nil, err
		}
		characters = append(characters, character)
	}

	return characters, rows.Err()
}

func Create_Character(ctx context.Context, database_pool *pgxpool.Pool, character models.Character) (*models.Character, error) {
	return scan_character(database_pool.QueryRow(ctx,
		`INSERT INTO characters
			(campaign_id, player_id, name, class, race, level, max_hp, current_hp,
			 armor_class, speed, stats, skill_profs, conditions)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING `+character_cols,
		character.Campaign_ID, character.Player_ID, character.Name, character.Class,
		character.Race, character.Level, character.MaxHP, character.Current_HP,
		character.Armor_Class, character.Speed, character.Stats, character.Skill_Proficiencies, character.Conditions,
	))
}

func Update_Character(ctx context.Context, database_pool *pgxpool.Pool, character models.Character) (*models.Character, error) {
	return scan_character(database_pool.QueryRow(ctx,
		`UPDATE characters SET
			campaign_id=$2, player_id=$3, name=$4, class=$5, race=$6, level=$7,
			max_hp=$8, current_hp=$9, armor_class=$10, speed=$11,
			stats=$12, skill_profs=$13, conditions=$14
		WHERE id=$1
		RETURNING `+character_cols,
		character.ID, character.Campaign_ID, character.Player_ID, character.Name,
		character.Class, character.Race, character.Level, character.MaxHP,
		character.Current_HP, character.Armor_Class, character.Speed,
		character.Stats, character.Skill_Proficiencies, character.Conditions,
	))
}

func Update_Character_HP(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID, currentHP int, maxHP int) error {
	_, err := database_pool.Exec(ctx,
		"UPDATE characters SET current_hp=$2, max_hp=$3 WHERE id=$1",
		id, currentHP, maxHP,
	)
	return err
}

func Delete_Character(ctx context.Context, database_pool *pgxpool.Pool, id uuid.UUID) error {
	_, err := database_pool.Exec(ctx, "DELETE FROM characters WHERE id=$1", id)
	return err
}
