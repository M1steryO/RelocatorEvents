package users

import (
	"context"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
)

func (c *userServiceClient) GetUserByTelegramId(ctx context.Context, telegramId int64) (string, error) {
	req := &desc.Get

	resp, err := c.client.Get(ctx, req)
	if err != nil {
		return "", err
	}
	return resp.User.Info.GetCountry(), nil
}
