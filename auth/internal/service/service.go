package service

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/dto"
)

type UserService interface {
	Get(ctx context.Context, id int64) (*domain.User, error)
	Create(ctx context.Context, user *dto.CreateUser) (int64, error)
	GetByTelegramId(ctx context.Context, telegramId int64) (*domain.User, error)
}

type AuthService interface {
	TelegramLogin(ctx context.Context, telegramId int64) (*auth.Credentials, error)
	Check(ctx context.Context, creds *auth.Credentials) (*auth.Credentials, error)
	GetRefreshToken(ctx context.Context, refreshToken string) (string, error)
	GetAccessToken(ctx context.Context, refreshToken string) (string, error)
}
