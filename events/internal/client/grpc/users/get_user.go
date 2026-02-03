package users

import (
	"context"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
)

func (c *userServiceClient) GetUserCountry(ctx context.Context, userId int64) (string, error) {
	req := &desc.GetRequest{Id: userId}

	resp, err := c.client.Get(ctx, req)
	if err != nil {
		return "", err
	}
	return resp.User.Info.GetCountry(), nil
}
