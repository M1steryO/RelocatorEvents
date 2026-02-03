package grpc

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/domain/auth"
)

type AuthServiceClient interface {
	GetRefreshToken(ctx context.Context, oldRefreshToken string) (string, error)
	GetAccessToken(ctx context.Context, refreshToken string) (auth.TokenPair, error)
}

type UserServiceClient interface {
	GetUserCountry(context.Context, int64) (string, error)
}
