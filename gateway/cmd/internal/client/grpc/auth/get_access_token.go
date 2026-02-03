package auth

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	""
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/domain/auth"
)



func (c *authServiceClient) GetAccessToken(ctx context.Context, refreshToken string) (auth.TokenPair, error) {
	req := &auth_v1.GetAccessTokenRequest{
		RefreshToken: refreshToken,
	}
	resp, err := c.client.GetAccessToken(ctx, req)

	if err != nil {
		return "", err
	}
	return auth.TokenPair{
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.ResreshToken
	}, nil
}

