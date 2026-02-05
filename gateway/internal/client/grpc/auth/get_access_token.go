package auth

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/domain/auth"
)

func (c *authServiceClient) GetAccessToken(ctx context.Context, refreshToken string) (auth.AuthData, error) {
	req := &auth_v1.GetAccessTokenRequest{
		RefreshToken: refreshToken,
	}
	resp, err := c.client.GetAccessToken(ctx, req)

	if err != nil {
		return auth.AuthData{}, err
	}
	return auth.AuthData{
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.RefreshToken,
	}, nil
}
