package hub

import (
	"encoding/json"
	"log"
	"time"
)

// incomingMessage carries a decoded envelope plus a reference to the sender.
type IncomingMessage struct {
	envelope WebsocketEnvelope
	sender   *Client
}

// Hub maintains the set of campaign rooms and routes messages between clients.
// hub.Run() is the only goroutine that modifies hub.rooms — all others communicate via channels.
type Hub struct {
	rooms      map[string]*Room
	register   chan *Client
	unregister chan *Client
	broadcast  chan *IncomingMessage
}

func New_Hub() *Hub {
	return &Hub{
		rooms:      make(map[string]*Room),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *IncomingMessage, 256),
	}
}

// Register enqueues a client for registration with the hub.
func (hub *Hub) Register(client *Client) {
	hub.register <- client
}

// Run is the hub's main event loop. Must be started as a goroutine.
func (hub *Hub) Run() {
	for {
		select {

		case client := <-hub.register:
			room, ok := hub.rooms[client.Campaign_ID]
			if !ok {
				room = new_room(client.Campaign_ID)
				hub.rooms[client.Campaign_ID] = room
			}
			room.clients[client] = true
			log.Printf("client registered  user=%s campaign=%s role=%s", client.User_ID, client.Campaign_ID, client.Role)

		case client := <-hub.unregister:
			room, ok := hub.rooms[client.Campaign_ID]
			if ok {
				if _, exists := room.clients[client]; exists {
					delete(room.clients, client)
					close(client.send)
				}
				if len(room.clients) == 0 {
					delete(hub.rooms, client.Campaign_ID)
				}
			}
			log.Printf("client unregistered user=%s", client.User_ID)

		case message := <-hub.broadcast:
			room, ok := hub.rooms[message.sender.Campaign_ID]
			if !ok {
				continue
			}

			// Enforce DM-only events server-side
			if DM_Only_Events[message.envelope.Type] && message.sender.Role != "dm" {
				log.Printf("dropping DM-only event %s from non-DM user=%s", message.envelope.Type, message.sender.User_ID)
				continue
			}

			message.envelope.Timestamp = time.Now().UnixMilli()
			data, err := json.Marshal(message.envelope)
			if err != nil {
				log.Printf("marshal error: %v", err)
				continue
			}

			for client := range room.clients {
				select {
				case client.send <- data:
				default:
					// Client buffer full — disconnect it
					close(client.send)
					delete(room.clients, client)
				}
			}
		}
	}
}
