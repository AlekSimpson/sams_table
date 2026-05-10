package auth

import (
	"context"
	"net/http"
	"strings"
)

type ContextKey string

// ClaimsKey is the context key under which JWTClaims are stored.
const Claims_Key ContextKey = "jwt_claims"

// Middleware validates the Bearer token on every request and injects claims into context.
func Middleware_Check_Token(webtoken_service *JWTService) func(http.Handler) http.Handler {
	return func(next_handler http.Handler) http.Handler {
		return http.HandlerFunc(func(response_writer http.ResponseWriter, request *http.Request) {
			auth_header := request.Header.Get("Authorization")
			if !strings.HasPrefix(auth_header, "Bearer ") {
				http.Error(response_writer, "unauthorized", http.StatusUnauthorized)
				return
			}
			token_string := strings.TrimPrefix(auth_header, "Bearer ")

			claims, err := webtoken_service.Parse(token_string)
			if err != nil {
				http.Error(response_writer, "unauthorized", http.StatusUnauthorized)
				return
			}

			context := context.WithValue(request.Context(), Claims_Key, claims)

			next_handler.ServeHTTP(response_writer, request.WithContext(context))
		})
	}
}

// RequireDM rejects requests from non-DM roles.
func Requires_DM(next_handler http.Handler) http.Handler {
	return http.HandlerFunc(func(response_writer http.ResponseWriter, request *http.Request) {
		claims := Get_Claims_From_Context(request.Context())
		if claims == nil || claims.Role != "dm" {
			http.Error(response_writer, "forbidden", http.StatusForbidden)
			return
		}

		next_handler.ServeHTTP(response_writer, request)
	})
}

// RequirePlayer rejects requests from non-player roles.
func Requires_Player(next_handler http.Handler) http.Handler {
	return http.HandlerFunc(func(response_writer http.ResponseWriter, request *http.Request) {
		claims := Get_Claims_From_Context(request.Context())
		if claims == nil || claims.Role != "player" {
			http.Error(response_writer, "forbidden", http.StatusForbidden)
			return
		}

		next_handler.ServeHTTP(response_writer, request)
	})
}

// ClaimsFromContext extracts JWTClaims from a request context.
func Get_Claims_From_Context(context context.Context) *JWTClaims {
	claims, _ := context.Value(Claims_Key).(*JWTClaims)
	return claims
}
