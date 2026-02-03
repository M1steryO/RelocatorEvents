package service

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/auth/internal/domain/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/dto"
)

type UserService interface {
	Get(ctx context.Context, id int64) (*user.User, error)
	Create(ctx context.Context, user *dto.CreateUser) (int64, error)
	GetByTelegramId(ctx context.Context, telegramId int64) (*user.User, error)
}
