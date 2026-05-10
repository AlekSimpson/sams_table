package hub

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	write_wait_period = 10 * time.Second
	pong_wait_period  = 60 * time.Second
	ping_period       = (pong_wait_period * 9) / 10
	max_message_size  = 512 * 1024 // 512 KB
)

// Upgrader handles the HTTP → WebSocket upgrade.
// CheckOrigin returns true for all origins in development; restrict in production.
var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: restrict to known origins in production
	},
}

// Client represents a single WebSocket connection.
type Client struct {
	hub          *Hub
	connection   *websocket.Conn
	send         chan []byte
	User_ID      string
	Campaign_ID  string
	Role         string
	Character_ID string
}

func New_Client(hub *Hub, conn *websocket.Conn, user_ID string, campaign_ID string, role string, character_ID string) *Client {
	return &Client{
		hub:          hub,
		connection:   conn,
		send:         make(chan []byte, 256),
		User_ID:      user_ID,
		Campaign_ID:  campaign_ID,
		Role:         role,
		Character_ID: character_ID,
	}
}

// ReadPump pumps messages from the WebSocket connection to the hub.
// Run as a goroutine per client.
func (client *Client) Read_Pump() {
	defer func() {
		client.hub.unregister <- client
		client.connection.Close()
	}()

	client.connection.SetReadLimit(max_message_size)
	client.connection.SetReadDeadline(time.Now().Add(pong_wait_period))
	client.connection.SetPongHandler(func(string) error {
		client.connection.SetReadDeadline(time.Now().Add(pong_wait_period))
		return nil
	})

	for {
		_, message, err := client.connection.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error user=%s: %v", client.User_ID, err)
			}
			break
		}

		var envelope WebsocketEnvelope
		if err := json.Unmarshal(message, &envelope); err != nil {
			log.Printf("ws unmarshal error: %v", err)
			continue
		}

		// Stamp sender identity server-side (never trust client-supplied sender)
		envelope.Sender_ID = client.User_ID
		envelope.Campaign_ID = client.Campaign_ID

		client.hub.broadcast <- &IncomingMessage{envelope: envelope, sender: client}
	}
}

// WritePump pumps messages from the hub to the WebSocket connection.
// Run as a goroutine per client. It is the sole writer to the connection.
func (client *Client) Write_Pump() {
	ticker := time.NewTicker(ping_period)
	defer func() {
		ticker.Stop()
		client.connection.Close()
	}()

	for {
		select {
		case message, ok := <-client.send:
			client.connection.SetWriteDeadline(time.Now().Add(write_wait_period))
			if !ok {
				client.connection.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := client.connection.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			client.connection.SetWriteDeadline(time.Now().Add(write_wait_period))
			if err := client.connection.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
