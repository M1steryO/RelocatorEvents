package user

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	"github.com/M1steryO/RelocatorEvents/auth/internal/utils/telegram"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
)

type Implementation struct {
	desc.UnimplementedUserV1Server
	service      service.UserService
	telegramAuth *telegram.TelegramAuthenticator
}

func NewUserImplementation(s service.UserService, telegramAuth *telegram.TelegramAuthenticator) *Implementation {
	return &Implementation{
		service:      s,
		telegramAuth: telegramAuth,
	}
}
