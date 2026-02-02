package service

import (
	"auth/internal/domain/user"
	"auth/internal/service/user/dto"
	"context"
)

type UserService interface {
	Get(ctx context.Context, id int64) (*user.User, error)
	Create(ctx context.Context, user *dto.CreateUser) (int64, error)
}
