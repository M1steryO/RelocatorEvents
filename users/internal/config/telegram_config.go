package config

import (
	"errors"
	"os"
)

const (
	botTokenEnvName = "BOT_TOKEN"
)

type TelegramConfig interface {
	Token() string
}
type telegramConfig struct {
	token string
}

func NewTelegramConfig() (TelegramConfig, error) {
	token := os.Getenv(botTokenEnvName)
	if len(token) == 0 {
		return nil, errors.New("telegram token env not found")
	}

	return &telegramConfig{
		token: token,
	}, nil
}

func (c *telegramConfig) Token() string {
	return c.token
}
