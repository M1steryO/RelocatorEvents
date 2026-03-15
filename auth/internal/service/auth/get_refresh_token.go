package auth

import (
	"context"
	"fmt"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/core/utils/jwt"
	"github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
)

func (s *serv) GetRefreshToken(ctx context.Context, refreshToken string) (string, error) {
	claims, err := jwtUtils.VerifyToken(
		refreshToken,
		s.jwtConfig.RefreshSecret(),
	)
	if err != nil {
		return "", auth.NewCredentialsError("invalid refresh token")
	}
	newRefreshToken, err := jwtUtils.GenerateToken(auth.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, s.jwtConfig.RefreshSecret(),
		s.jwtConfig.RefreshExpiration())

	if err != nil {
		return "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return newRefreshToken, nil
}
