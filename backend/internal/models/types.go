package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// CharacterStats maps the stats JSONB column. Implements driver.Valuer and sql.Scanner
// so pgx can marshal/unmarshal it automatically.
type CharacterStats struct {
	Str int `json:"str"`
	Dex int `json:"dex"`
	Con int `json:"con"`
	Int int `json:"int"`
	Wis int `json:"wis"`
	Cha int `json:"cha"`
}

func (s CharacterStats) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *CharacterStats) Scan(src any) error {
	var b []byte
	switch v := src.(type) {
	case []byte:
		b = v
	case string:
		b = []byte(v)
	default:
		return fmt.Errorf("cannot scan CharacterStats from %T", src)
	}
	return json.Unmarshal(b, s)
}

// --- DB Models ---

type ArmorProficiency string

const (
	LIGHT   ArmorProficiency = "Light"
	MEDIUIM ArmorProficiency = "Medium"
	HEAVY   ArmorProficiency = "Heavy"
)

type ClassSkill struct {
	Name               string   `json:"name" db:"name"`
	Stat               string   `json:"stat" db:"stat"`
	Allowed_Class_Keys []string `json:"allowed_classes" db:"allowed_classes"`
}

type Attack struct {
	Id     uuid.UUID `json:"id" db:"id"`
	Name   string    `json:"name" db:"name"`
	Range  int       `json:"range" db:"range"`
	DC     int       `json:"dc" db:"dc"`
	Damage int       `json:"damage" db:"damage"`
}

type Action struct {
	Id          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
}

type Spell struct {
	Id   uuid.UUID `json:"id" db:"id"`
	Name string    `json:"name" db:"name"`
}

type Class struct {
	Key                         string             `json:"key" db:"key"`
	Name                        string             `json:"name" db:"name"`
	Hit_Die                     int                `json:"hit_die" db:"hit_die"`
	Armor_Proficiencies         []ArmorProficiency `json:"armor_prof" db:"armor_prof"`
	Max_Skill_Proficiency_Count int                `json:"max_skill_prof_count" db:"max_skill_prof_count"`
	Saving_Throw_Proficiencies  []string           `json:"saving_throw_profs" db:"saving_throw_profs"`
}

type Race struct {
	Key                     string   `json:"key" db:"key"`
	Name                    string   `json:"name" db:"name"`
	Ability_Increase_Keys   []string `json:"aik" db:"aik"`
	Ability_Increase_Values []int    `json:"aiv" db:"aiv"`
	Traits                  []string `json:"traits" db:"traits"`
	Base_Movement_Speed     int      `json:"base_speed" db:"base_speed"`
	Languages               []string `json:"languages" db:"languages"`
	Skill_Proficiencies     []string `json:"skill_prof" db:"skill_prof"`
}

type User struct {
	ID            uuid.UUID `json:"id" db:"id"`
	Username      string    `json:"username" db:"username"`
	Password_Hash string    `json:"-" db:"password_hash"`
	Created_At    time.Time `json:"created_at" db:"created_at"`
}

type Campaign struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	DM_ID       uuid.UUID `json:"dm_id" db:"dm_id"`
	Created_At  time.Time `json:"created_at" db:"created_at"`
}

type Character struct {
	ID                  uuid.UUID      `json:"id" db:"id"`
	Campaign_ID         *uuid.UUID     `json:"campaign_id,omitempty" db:"campaign_id"`
	Player_ID           *uuid.UUID     `json:"player_id,omitempty" db:"player_id"`
	Name                string         `json:"name" db:"name"`
	Class               string         `json:"class" db:"class"`
	Race                string         `json:"race" db:"race"`
	Level               int            `json:"level" db:"level"`
	MaxHP               int            `json:"max_hp" db:"max_hp"`
	Current_HP          int            `json:"current_hp" db:"current_hp"`
	Armor_Class         int            `json:"armor_class" db:"armor_class"`
	Speed               int            `json:"speed" db:"speed"`
	Stats               CharacterStats `json:"stats" db:"stats"`
	Skill_Proficiencies []string       `json:"skill_profs" db:"skill_profs"`
	Conditions          []string       `json:"conditions" db:"conditions"`
	Attacks             []Attack       `json:"attacks" db:"attacks"`
	CreatedAt           time.Time      `json:"created_at" db:"created_at"`
}

type Map struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Campaign_ID uuid.UUID `json:"campaign_id" db:"campaign_id"`
	Name        string    `json:"name" db:"name"`
	Grid_Width  int       `json:"grid_width" db:"grid_width"`
	Grid_Height int       `json:"grid_height" db:"grid_height"`
	Created_At  time.Time `json:"created_at" db:"created_at"`
}

type MapTile struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Map_ID       uuid.UUID `json:"map_id" db:"map_id"`
	Asset_ID     string    `json:"asset_id" db:"asset_id"`
	Asset_Source string    `json:"asset_source" db:"asset_source"` // "default" | "uploaded"
	Grid_X       int       `json:"grid_x" db:"grid_x"`
	Grid_Y       int       `json:"grid_y" db:"grid_y"`
	Grid_Z       int       `json:"grid_z" db:"grid_z"`
	Rotation_Y   float64   `json:"rotation_y" db:"rotation_y"`
}

type UploadedAsset struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Campaign_ID  *uuid.UUID `json:"campaign_id,omitempty" db:"campaign_id"`
	Uploaded_By  uuid.UUID  `json:"uploaded_by" db:"uploaded_by"`
	Label        string     `json:"label" db:"label"`
	Storage_Path string     `json:"storage_path" db:"storage_path"`
	Grid_Width   int        `json:"grid_width" db:"grid_width"`
	Grid_Depth   int        `json:"grid_depth" db:"grid_depth"`
	Scale_Factor float64    `json:"scale_factor" db:"scale_factor"`
	Asset_Type   string     `json:"asset_type" db:"asset_type"` // "map_tile" | "mini"
	Created_At   time.Time  `json:"created_at" db:"created_at"`
}

type Session struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	Campaign_ID   *uuid.UUID `json:"campaign_id,omitempty" db:"campaign_id"`
	Active_Map_ID *uuid.UUID `json:"active_map_id,omitempty" db:"active_map_id"`
	Started_At    time.Time  `json:"started_at" db:"started_at"`
	Ended_At      *time.Time `json:"ended_at,omitempty" db:"ended_at"`
}

// --- API Request / Response Types ---

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
