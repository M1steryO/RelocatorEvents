package user

import (
	"auth/internal/repository"
	"auth/internal/service"
	"github.com/M1steryO/platform_common/pkg/db"
)

type serv struct {
	db        repository.UserRepository
	txManager db.TxManager
}

func NewUserService(repo repository.UserRepository, txManager db.TxManager) service.UserService {
	return &serv{
		db:        repo,
		txManager: txManager,
	}
}
