package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims holds the custom claims embedded in every token.
type JWTClaims struct {
	User_ID      string `json:"user_id"`
	Campaign_ID  string `json:"campaign_id"`
	Role         string `json:"role"` // "dm" | "player"
	Character_ID string `json:"character_id,omitempty"`
	jwt.RegisteredClaims
}

// JWTService signs and validates JWTs.
type JWTService struct {
	secret []byte
	expiry time.Duration
}

func New_JWT_Service(secret string) *JWTService {
	return &JWTService{
		secret: []byte(secret),
		expiry: 24 * time.Hour,
	}
}

// Sign creates and signs a JWT for the given claims.
func (self *JWTService) Sign(claims JWTClaims) (string, error) {
	// TODO: populate RegisteredClaims (IssuedAt, ExpiresAt, Subject) and sign
	current_time := time.Now()

	claims.IssuedAt = jwt.NewNumericDate(current_time)
	claims.ExpiresAt = jwt.NewNumericDate(current_time.Add(self.expiry))
	claims.Subject = claims.User_ID

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed_string, err := token.SignedString(self.secret)

	return signed_string, err
}

// Parse validates a JWT string and returns the embedded claims.
func (self *JWTService) Parse(token_string string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(token_string, &JWTClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return self.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	return claims, nil
}
