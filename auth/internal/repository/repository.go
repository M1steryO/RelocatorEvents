package repository

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
)

type UserRepository interface {
	Get(ctx context.Context, id int64) (*domain.User, error)
	GetByTelegramId(ctx context.Context, telegramId int64) (*domain.User, error)
	GetInterestsByCodes(ctx context.Context, interestsCodes []string) ([]int64, error)

	CreateUserData(ctx context.Context, userId int64, telegramUsername string, userInfo *domain.UserInfo) error
	Create(ctx context.Context, user *domain.User) (int64, error)
	CreateUserInterests(ctx context.Context, userId int64, interestsIds []int64) error
}
