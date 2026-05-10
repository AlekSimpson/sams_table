package hub

// Room holds all connected clients for a single campaign.
type Room struct {
	Campaign_ID string
	clients    map[*Client]bool
	initiative []InitiativeEntry // ephemeral — not persisted to DB
}

func new_room(campaign_id string) *Room {
	return &Room{
		Campaign_ID: campaign_id,
		clients:    make(map[*Client]bool),
		initiative: []InitiativeEntry{},
	}
}
