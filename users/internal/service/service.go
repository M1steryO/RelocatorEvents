package service

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/users/internal/service/user/dto"
)

type UserService interface {
	Get(ctx context.Context, id int64) (*domain.User, error)
	Create(ctx context.Context, user *dto.CreateUser) (int64, error)
	GetByTelegramId(ctx context.Context, telegramId int64) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
}
