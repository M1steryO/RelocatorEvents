package user

import (
	"github.com/M1steryO/RelocatorEvents/users/internal/repository"
	"github.com/M1steryO/platform_common/pkg/db"
)

const constraintErrorCode = "23505"

type repo struct {
	db db.Client
}

func NewUserRepository(db db.Client) repository.UserRepository {
	return &repo{
		db: db,
	}
}
