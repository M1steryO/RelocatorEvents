package auth

import (
	"context"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/domain/auth"
)

func (c *authServiceClient) TelegramLogin(ctx context.Context, telegramId int64) (auth.AuthData, error) {
	req := &desc.TelegramLoginRequest{
		TelegramId: telegramId,
	}
	resp, err := c.client.TelegramLogin(ctx, req)

	if err != nil {
		return auth.AuthData{}, err
	}
	return auth.AuthData{
		AccessToken:  resp.GetAccessToken(),
		RefreshToken: resp.GetRefreshToken(),
	}, nil
}
