package auth

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/config"
	"github.com/M1steryO/RelocatorEvents/auth/internal/core/utils/telegram"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
)

type serv struct {
	userService  service.UserService
	telegramAuth *telegram.TelegramAuthenticator
	jwtConfig    config.JWTConfig
}

func NewAuthService(userService service.UserService, telegramAuth *telegram.TelegramAuthenticator, jwtConfig config.JWTConfig) service.AuthService {
	return &serv{
		userService:  userService,
		telegramAuth: telegramAuth,
		jwtConfig:    jwtConfig,
	}
}
