package auth

import (
	"context"
	authModel "github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
)

func (s *serv) TelegramLogin(ctx context.Context, telegramId int64) (*authModel.Credentials, error) {
	role := "ADMIN" // TODO: Get user role from db

	user, err := s.userService.GetByTelegramId(ctx, telegramId)
	if err != nil {
		return nil, err
	}

	userInfo := authModel.UserInfo{
		Id:   user.ID,
		Role: role,
	}

	creds, err := s.issueTokens(userInfo.Id, userInfo.Role)
	if err != nil {
		return nil, err
	}
	return &creds, nil

}
