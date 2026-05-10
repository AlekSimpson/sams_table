package queries

import (
	"context"

	"sams_table/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

func List_Classes(ctx context.Context, pool *pgxpool.Pool) ([]models.Class, error) {
	rows, err := pool.Query(ctx,
		`SELECT key, name, hit_die, armor_prof, max_skill_prof_count, saving_throw_profs
		 FROM dnd_classes ORDER BY name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []models.Class
	for rows.Next() {
		var class models.Class
		var armor_profs []string
		if err := rows.Scan(
			&class.Key, &class.Name, &class.Hit_Die,
			&armor_profs, &class.Max_Skill_Proficiency_Count, &class.Saving_Throw_Proficiencies,
		); err != nil {
			return nil, err
		}
		class.Armor_Proficiencies = make([]models.ArmorProficiency, len(armor_profs))
		for i, p := range armor_profs {
			class.Armor_Proficiencies[i] = models.ArmorProficiency(p)
		}
		classes = append(classes, class)
	}
	return classes, rows.Err()
}

func Get_Skills_For_Class(ctx context.Context, pool *pgxpool.Pool, class *models.Class) ([]models.ClassSkill, error) {
	rows, err := pool.Query(ctx,
		`SELECT name, stat, allowed_classes FROM dnd_skills WHERE $1 = ANY(allowed_classes)`,
		class.Key,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []models.ClassSkill
	for rows.Next() {
		var s models.ClassSkill
		if err := rows.Scan(&s.Name, &s.Stat, &s.Allowed_Class_Keys); err != nil {
			return nil, err
		}
		skills = append(skills, s)
	}
	return skills, rows.Err()
}

func Get_Class_By_Key(ctx context.Context, pool *pgxpool.Pool, key string) (*models.Class, error) {
	var class models.Class
	var armor_profs []string
	err := pool.QueryRow(ctx,
		`SELECT key, name, hit_die, armor_prof, max_skill_prof_count, saving_throw_profs
		 FROM dnd_classes WHERE key = $1`,
		key,
	).Scan(
		&class.Key, &class.Name, &class.Hit_Die,
		&armor_profs, &class.Max_Skill_Proficiency_Count, &class.Saving_Throw_Proficiencies,
	)
	if err != nil {
		return nil, err
	}
	class.Armor_Proficiencies = make([]models.ArmorProficiency, len(armor_profs))
	for i, p := range armor_profs {
		class.Armor_Proficiencies[i] = models.ArmorProficiency(p)
	}
	return &class, nil
}

func List_Races(ctx context.Context, pool *pgxpool.Pool) ([]models.Race, error) {
	rows, err := pool.Query(ctx,
		`SELECT key, name, aik, aiv, traits, base_speed, languages, skill_prof FROM dnd_races ORDER BY name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var races []models.Race
	for rows.Next() {
		var r models.Race
		if err := rows.Scan(
			&r.Key, &r.Name, &r.Ability_Increase_Keys, &r.Ability_Increase_Values,
			&r.Traits, &r.Base_Movement_Speed, &r.Languages, &r.Skill_Proficiencies,
		); err != nil {
			return nil, err
		}
		races = append(races, r)
	}
	return races, rows.Err()
}

func Get_Race_By_Key(ctx context.Context, pool *pgxpool.Pool, key string) (*models.Race, error) {
	var r models.Race
	err := pool.QueryRow(ctx,
		`SELECT key, name, aik, aiv, traits, base_speed, languages, skill_prof FROM dnd_races WHERE key = $1`,
		key,
	).Scan(
		&r.Key, &r.Name, &r.Ability_Increase_Keys, &r.Ability_Increase_Values,
		&r.Traits, &r.Base_Movement_Speed, &r.Languages, &r.Skill_Proficiencies,
	)
	if err != nil {
		return nil, err
	}
	return &r, nil
}
