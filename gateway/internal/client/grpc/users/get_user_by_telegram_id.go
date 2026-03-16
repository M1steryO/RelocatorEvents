package users

import (
	"context"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/user/v1"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/domain/user"
)

func (c *userServiceClient) GetUserByTelegramId(ctx context.Context, telegramId int64) (*user.User, error) {
	req := &desc.GetUserByTelegramIdRequest{
		TelegramId: telegramId,
	}

	resp, err := c.client.GetUserByTelegramId(ctx, req)
	if err != nil {
		return nil, err
	}
	return &user.User{
		ID: resp.User.Id,
	}, nil
}
