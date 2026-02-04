package middleware

import (
	"context"
	clients "github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/client/grpc"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/domain/auth"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/logger"
	"net/http"
	"strings"
)

const (
	ctxUserIdKey = "userId"
	tokenPrefix  = "Bearer "
)

type AuthMiddleware struct {
	auth clients.AuthServiceClient
	user clients.UserServiceClient
}

func NewAuthMiddleware(auth clients.AuthServiceClient) *AuthMiddleware {
	return &AuthMiddleware{auth: auth}
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		authHeader := r.Header.Get("Authorization")
		tg := r.Header.Get("X-Telegram-Init-Data")

		var refreshCookie string
		if c, err := r.Cookie("refresh_token"); err == nil && c != nil {
			refreshCookie = c.Value
		}

		var (
			resp *auth.AuthData
			err  error
		)

		if strings.HasPrefix(authHeader, tokenPrefix) || refreshCookie != "" || tg != "" {
			accessToken := strings.TrimPrefix(authHeader, tokenPrefix)
			resp, err = m.auth.Check(ctx, accessToken, refreshCookie, tg)
		} else {
			logger.Info("credentials not found")
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		if err != nil || resp == nil || resp.UserId == 0 {
			logger.Info("invalid tokens", "err", err.Error())
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		if resp.RefreshToken != "" {
			setRefreshCookie(w, resp.RefreshToken)
		}
		if resp.AccessToken != "" {
			w.Header().Set("Authorization", tokenPrefix+resp.AccessToken)
		}

		ctx = context.WithValue(ctx, ctxUserIdKey, resp.UserId)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func setRefreshCookie(w http.ResponseWriter, token string) {
	sameSite := http.SameSiteNoneMode

	c := &http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: sameSite,
	}
	http.SetCookie(w, c)
}
