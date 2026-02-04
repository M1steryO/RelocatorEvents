package auth

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/domain/auth"
)

func (c *authServiceClient) Check(ctx context.Context, accessToken, refreshToken, initData string) (auth.AuthData, error) {
	req := &auth_v1.Chec{
		RefreshToken: refreshToken,
	}
	resp, err := c.client.GetAccessToken(ctx, req)

	if err != nil {
		return auth.TokenPair{}, err
	}
	return auth.AuthData{
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.RefreshToken,
	}, nil
}
