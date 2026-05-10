package hub

import "encoding/json"

// EventType identifies the kind of WebSocket event.
type EventType string
const (
	Event_HP_Update          EventType = "hp_update"
	Event_Map_Activated      EventType = "map_activated"
	Event_Map_Tile_Placed    EventType = "map_tile_placed"
	Event_Map_Tile_Removed   EventType = "map_tile_removed"
	Event_Token_Moved        EventType = "token_moved"
	Event_Dice_Roll_Request  EventType = "dice_roll_request"
	Event_Dice_Roll_Result   EventType = "dice_roll_result"
	Event_Initiative_Update  EventType = "initiative_update"
	Event_Visibility_Toggle  EventType = "visibility_toggle"
	Event_Condition_Update   EventType = "condition_update"
)

// DMOnlyEvents lists the event types that only a DM client may broadcast.
var DM_Only_Events = map[EventType]bool{
	Event_Map_Activated:     true,
	Event_Map_Tile_Placed:    true,
	Event_Map_Tile_Removed:   true,
	Event_Visibility_Toggle: true,
}

// Envelope is the top-level JSON wrapper for all WebSocket messages.
type WebsocketEnvelope struct {
	Type        EventType       `json:"type"`
	Campaign_ID string          `json:"campaign_id"`
	Sender_ID   string          `json:"sender_id"`
	Payload     json.RawMessage `json:"payload"`
	Timestamp   int64           `json:"ts"`
}

// --- Typed payload structs ---

type HPUpdatePayload struct {
	Character_ID string `json:"character_id"`
	Current_HP   int    `json:"current_hp"`
	Max_HP       int    `json:"max_hp"`
}

type MapTilePlacedPayload struct {
	Tile_ID      string  `json:"tile_id"`
	Asset_ID     string  `json:"asset_id"`
	Asset_Source string  `json:"asset_source"`
	Grid_X       int     `json:"grid_x"`
	Grid_Y       int     `json:"grid_y"`
	Grid_Z       int     `json:"grid_z"`
	Rotation_Y   float64 `json:"rotation_y"`
}

type MapTileRemovedPayload struct {
	Tile_ID string `json:"tile_id"`
}

type TokenMovedPayload struct {
	Token_ID     string `json:"token_id"`
	Character_ID string `json:"character_id"`
	Grid_X       int    `json:"grid_x"`
	Grid_Y       int    `json:"grid_y"`
}

type DiceRollRequestPayload struct {
	Notation      string `json:"notation"`
	Character_ID  string `json:"character_id"`
	Roller_Name   string `json:"roller_name"`
}

type DiceRollResultPayload struct {
	Roller_ID   string `json:"roller_id"`
	Roller_Name string `json:"roller_name"`
	Dice        string `json:"dice"`
	Results     []int  `json:"results"`
	Total       int    `json:"total"`
}

type InitiativeEntry struct {
	Character_ID string `json:"character_id"`
	Name         string `json:"name"`
	Initiative   int    `json:"initiative"`
	Is_NPC       bool   `json:"is_npc"`
}

type InitiativeUpdatePayload struct {
	Ordered_Entries []InitiativeEntry `json:"ordered_entries"`
}

type VisibilityTogglePayload struct {
	Target_Player_ID string `json:"target_player_id"`
	Visible          bool   `json:"visible"`
}

type ConditionUpdatePayload struct {
	Character_ID string   `json:"character_id"`
	Conditions   []string `json:"conditions"`
}
