package repository

import (
	"auth/internal/domain/user"
	modelRepo "auth/internal/repository/user/model"
	"context"
)

type UserRepository interface {
	Create(ctx context.Context, user *modelRepo.User) (int64, error)
	Get(ctx context.Context, id int64) (*user.User, error)
	CreateUserData(ctx context.Context, userId int64, telegramUsername string, userInfo *modelRepo.UserInfo) error

	GetInterestsByCodes(ctx context.Context, interestsCodes []string) ([]int64, error)
	CreateUserInterests(ctx context.Context, userId int64, interestsIds []int64) error
}
