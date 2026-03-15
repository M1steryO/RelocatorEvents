package auth

import (
	"context"
	"fmt"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/core/utils/jwt"
	"github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
)

func (s *serv) GetAccessToken(ctx context.Context, refreshToken string) (string, error) {
	claims, err := jwtUtils.VerifyToken(
		refreshToken,
		s.jwtConfig.RefreshSecret(),
	)
	if err != nil {
		return "", auth.NewCredentialsError("invalid refresh token")
	}

	accessToken, err := jwtUtils.GenerateToken(auth.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, s.jwtConfig.AccessSecret(),
		s.jwtConfig.AccessExpiration())

	if err != nil {
		return "", fmt.Errorf("failed to generate access token: %w", err)
	}

	return accessToken, nil
}
