package auth

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/config"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	"github.com/M1steryO/RelocatorEvents/auth/internal/utils/telegram"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
)

type Implementation struct {
	descAuth.UnimplementedAuthV1Server
	service      service.UserService
	telegramAuth *telegram.TelegramAuthenticator
	jwtConfig    config.JWTConfig
}

func NewImplementation(service service.UserService, telegramAuth *telegram.TelegramAuthenticator, jwtConfig config.JWTConfig) *Implementation {
	return &Implementation{
		service:      service,
		telegramAuth: telegramAuth,
		jwtConfig:    jwtConfig,
	}
}
