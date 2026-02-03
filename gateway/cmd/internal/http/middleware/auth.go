package middleware

import (
	"context"
	"net/http"

	clients "github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/client/grpc"
)

type ctxKey int

const ctxUserID ctxKey = iota

func UserIDFromContext(ctx context.Context) (int64, bool) {
	v := ctx.Value(ctxUserID)
	id, ok := v.(int64)
	return id, ok
}

type AuthMiddleware struct {
	auth clients.AuthServiceClient
}

func NewAuthMiddleware(auth clients.AuthServiceClient) *AuthMiddleware {
	return &AuthMiddleware{auth: auth}
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authorization := r.Header.Get("Authorization")
		cookie := r.Header.Get("Cookie")
		tg := r.Header.Get("X-Telegram-Init-Data")

		res, err := m.auth.Check(r.Context(), authorization, cookie, tg)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		// Прокидываем обновлённые токены в ответ клиенту
		for _, sc := range res.SetCookie {
			w.Header().Add("Set-Cookie", sc)
		}
		// Обычно authorization один, но пусть будет add
		for _, ah := range res.AuthHeader {
			w.Header().Set("Authorization", ah)
		}

		ctx := context.WithValue(r.Context(), ctxUserID, res.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
