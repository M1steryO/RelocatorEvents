package middleware

import (
	"net/http"
)

type CORS struct {
	allowed map[string]bool
}

func NewCORS(allowedOrigins []string) *CORS {
	m := make(map[string]bool, len(allowedOrigins))
	for _, o := range allowedOrigins {
		m[o] = true
	}
	return &CORS{allowed: m}
}

func (c *CORS) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && c.allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Telegram-Init-Data")
			w.Header().Set("Access-Control-Expose-Headers", "Authorization, Set-Cookie")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
