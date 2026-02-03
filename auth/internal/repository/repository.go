package repository

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/auth/internal/domain/user"
	modelRepo "github.com/M1steryO/RelocatorEvents/auth/internal/repository/user/model"
)

type UserRepository interface {
	Get(ctx context.Context, id int64) (*user.User, error)
	GetByTelegramId(ctx context.Context, telegramId int64) (*user.User, error)
	GetInterestsByCodes(ctx context.Context, interestsCodes []string) ([]int64, error)

	CreateUserData(ctx context.Context, userId int64, telegramUsername string, userInfo *modelRepo.UserInfo) error
	Create(ctx context.Context, user *modelRepo.User) (int64, error)
	CreateUserInterests(ctx context.Context, userId int64, interestsIds []int64) error
}
