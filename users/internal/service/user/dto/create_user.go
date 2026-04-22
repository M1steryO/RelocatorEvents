package dto

import (
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
)

type CreateUser struct {
	Name  string
	Email *string

	TelegramId       *int64
	TelegramUsername string

	City     string
	Country  string
	Language string

	Interests []string

	Password        string
	ConfirmPassword string
}

func (c CreateUser) ToDomain(telegramId *int64) *domain.User {
	convertedInterests := make([]domain.Interest, len(c.Interests))
	for i, interest := range c.Interests {
		convertedInterests[i] = domain.Interest{
			Code: interest,
		}
	}

	return &domain.User{
		Password: c.Password,
		Info: domain.UserInfo{
			Name:  c.Name,
			Email: c.Email,

			TelegramID:       telegramId,
			TelegramUsername: c.TelegramUsername,

			City:    c.City,
			Country: c.Country,

			Language: c.Language,

			Interests: convertedInterests,
		},
	}
}
