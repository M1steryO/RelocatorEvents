package access

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	"github.com/M1steryO/RelocatorEvents/auth/internal/utils/telegram"
	descAccess "github.com/M1steryO/RelocatorEvents/auth/pkg/access_v1"
)

type Implementation struct {
	descAccess.UnimplementedAccessV1Server
	service      service.UserService
	telegramAuth *telegram.TelegramAuthenticator
}

func NewImplementation(service service.UserService, telegramAuth *telegram.TelegramAuthenticator) *Implementation {
	return &Implementation{
		service:      service,
		telegramAuth: telegramAuth,
	}
}
