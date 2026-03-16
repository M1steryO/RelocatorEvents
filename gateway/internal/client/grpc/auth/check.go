package auth

import (
	"context"
	authProto "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/auth/v1"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/domain/auth"
)

func (c *authServiceClient) Check(ctx context.Context, accessToken, refreshToken, initData string) (*auth.AuthData, error) {
	req := &authProto.CheckRequest{
		RefreshToken:     refreshToken,
		AccessToken:      accessToken,
		TelegramInitData: initData,
	}
	resp, err := c.client.Check(ctx, req)

	if err != nil {
		return nil, err
	}

	return &auth.AuthData{
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.RefreshToken,
		UserId:       resp.UserId,
	}, nil
}
