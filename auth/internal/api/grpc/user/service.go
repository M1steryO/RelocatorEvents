package user

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/core/utils/telegram"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/user/v1"
)

type Implementation struct {
	desc.UnimplementedUserServiceServer
	service      service.UserService
	telegramAuth *telegram.TelegramAuthenticator
}

func NewUserImplementation(s service.UserService, telegramAuth *telegram.TelegramAuthenticator) *Implementation {
	return &Implementation{
		service:      s,
		telegramAuth: telegramAuth,
	}
}
