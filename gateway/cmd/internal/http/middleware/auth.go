package middleware

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/utils/telegram"
	"google.golang.org/grpc/metadata"
	"net/http"
	"time"

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
	user clients.UserServiceClient
	telegramAuth *telegram.TelegramAuthenticator
}

func NewAuthMiddleware(auth clients.AuthServiceClient, telegramAuth *telegram.TelegramAuthenticator) *AuthMiddleware {
	return &AuthMiddleware{auth: auth, telegramAuth: telegramAuth}
}


const refreshTokenExpiration = 60 * time.Minute
const refreshTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g0="
const accessTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g01"
const accessTokenExpiration = 10 * time.Minute

func (m *AuthMiddleware) checkTelegramInitData(ctx context.Context, initData string) (int64, error) {

	clearData, err := m.telegramAuth.Validate(initData, 500*time.Hour)
	if err != nil {
		return 0, err
	}
	if clearData.User == nil {
		return 0, errors.New("user-data is not provided")
	}
	telegramId := clearData.User.ID
	user, err := m.user.GetUserByTelegramId(ctx, telegramId)
	if err != nil {
		return 0, err
	}
	err = setTokens(ctx, user.ID, "user")
	if err != nil {
		return 0, err
	}
	return user.ID, nil
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authorization := r.Header.Get("Authorization")
		cookie := r.Header.Get("Cookie")
		tg := r.Header.Get("X-Telegram-Init-Data")


		if authorization == ""{
			if cookie == "" {
				if tg == "" {
					w.WriteHeader(http.StatusUnauthorized)
					return
				}


			}
		}


		res, err := m.auth.
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
