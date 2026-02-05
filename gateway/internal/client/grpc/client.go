package grpc

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/domain/auth"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/domain/user"
)

type AuthServiceClient interface {
	GetRefreshToken(ctx context.Context, oldRefreshToken string) (string, error)
	GetAccessToken(ctx context.Context, refreshToken string) (auth.AuthData, error)
	TelegramLogin(ctx context.Context, telegramId int64) (auth.AuthData, error)
	Check(ctx context.Context, accessToken, refreshToken, initData string) (*auth.AuthData, error)
}

type UserServiceClient interface {
	GetUserByTelegramId(ctx context.Context, telegramId int64) (*user.User, error)
}
