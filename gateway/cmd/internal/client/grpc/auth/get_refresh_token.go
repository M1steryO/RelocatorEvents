package auth

import (
	"github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"golang.org/x/net/context"
)

func (c *authServiceClient) GetRefreshToken(ctx context.Context, oldRefreshToken string) (string, error) {
	req := &auth_v1.GetRefreshTokenRequest{
		OldRefreshToken: oldRefreshToken,
	}
	resp, err := c.client.GetRefreshToken(ctx, req)

	if err != nil {
		return "", err
	}
	return resp.GetRefreshToken(), nil
}
