package dto

import (
	repoModel "github.com/M1steryO/RelocatorEvents/auth/internal/repository/user/model"
)

type CreateUser struct {
	Name  string
	Email string

	TelegramId       *int64
	TelegramUsername string

	City    string
	Country string

	Interests []string

	Password        string
	ConfirmPassword string
}

func (c CreateUser) ToRepo(telegramId *int64) *repoModel.User {
	convertedInterests := make([]repoModel.UserInterest, len(c.Interests))
	for i, interest := range c.Interests {
		convertedInterests[i] = repoModel.UserInterest{
			Code: interest,
		}
	}

	return &repoModel.User{
		Info: &repoModel.UserInfo{
			Name:  c.Name,
			Email: c.Email,

			TelegramId:       telegramId,
			TelegramUsername: c.TelegramUsername,

			City:    c.City,
			Country: c.Country,

			Interests: convertedInterests,
		},
	}
}
