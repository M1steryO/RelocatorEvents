package grpc

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/domain/auth"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/domain/user"
)

type AuthServiceClient interface {
	GetRefreshToken(ctx context.Context, oldRefreshToken string) (string, error)
	GetAccessToken(ctx context.Context, refreshToken string) (auth.TokenPair, error)
}

type UserServiceClient interface {
	GetUserByTelegramId(ctx context.Context, telegramId int64) (*user.User, error)
}
