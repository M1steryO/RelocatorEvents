package users

import (
	"context"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/user/v1"
)

func (c *userServiceClient) GetUserName(ctx context.Context, userId int64) (string, error) {
	req := &desc.GetRequest{Id: userId}

	resp, err := c.client.Get(ctx, req)
	if err != nil {
		return "", err
	}
	name := resp.GetUser().GetInfo().GetName()
	if name == "" {
		return resp.User.Info.GetTelegramUsername(), nil
	}
	return resp.User.Info.GetName(), nil
}
