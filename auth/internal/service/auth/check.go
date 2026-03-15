package auth

import (
	"context"
	"errors"
	"fmt"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/core/utils/jwt"
	"github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
	"github.com/golang-jwt/jwt/v5"
	"time"
)

func (s *serv) issueTokens(userID int64, role string) (auth.Credentials, error) {
	userInfo := auth.UserInfo{
		Id:   userID,
		Role: role,
	}

	access, err := jwtUtils.GenerateToken(userInfo, s.jwtConfig.AccessSecret(), s.jwtConfig.AccessExpiration())
	if err != nil {
		return auth.Credentials{}, fmt.Errorf("failed to generate access token : %w", err)
	}

	refresh, err := jwtUtils.GenerateToken(userInfo, s.jwtConfig.RefreshSecret(), s.jwtConfig.RefreshExpiration())
	if err != nil {
		return auth.Credentials{}, fmt.Errorf("failed to generate refresh token : %w", err)
	}

	return auth.Credentials{AccessToken: access, RefreshToken: refresh}, nil
}

func (s *serv) handleTelegram(ctx context.Context, initData string) (*auth.Credentials, error) {
	clearData, err := s.telegramAuth.Validate(initData, 5000000*time.Minute)
	if err != nil {
		return nil, auth.NewCredentialsError("invalid init data")
	}
	if clearData.User == nil {
		return nil, auth.NewCredentialsError("user-data is not provided")
	}

	telegramID := clearData.User.ID
	user, err := s.userService.GetByTelegramId(ctx, telegramID)
	if err != nil {
		return nil, err
	}

	role := "ADMIN" // TODO: брать из user
	tp, err := s.issueTokens(user.ID, role)
	if err != nil {
		return nil, err
	}

	return &auth.Credentials{
		UserId:       user.ID,
		AccessToken:  tp.AccessToken,
		RefreshToken: tp.RefreshToken,
	}, nil
}

func (s *serv) handleJWT(_ context.Context, accessToken, refreshToken string) (*auth.Credentials, error) {
	if accessToken != "" {
		claims, err := jwtUtils.VerifyToken(accessToken, s.jwtConfig.AccessSecret())
		if err == nil {
			return &auth.Credentials{UserId: claims.Id}, nil
		}

		if !errors.Is(err, jwt.ErrTokenExpired) {
			return nil, auth.NewCredentialsError("invalid access token")
		}
	}

	refreshClaims, err := jwtUtils.VerifyToken(refreshToken, s.jwtConfig.RefreshSecret())
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, auth.NewCredentialsError("refresh token expired")
		}
		return nil, auth.NewCredentialsError("invalid refresh token")
	}

	tp, err := s.issueTokens(refreshClaims.Id, refreshClaims.Role)
	if err != nil {
		return nil, err
	}

	return &auth.Credentials{
		UserId:       refreshClaims.Id,
		AccessToken:  tp.AccessToken,
		RefreshToken: tp.RefreshToken,
	}, nil
}

func (s *serv) Check(ctx context.Context, creds *auth.Credentials) (*auth.Credentials, error) {
	if creds.InitData != "" {
		return s.handleTelegram(ctx, creds.InitData)
	}

	if creds.RefreshToken != "" {
		return s.handleJWT(ctx, creds.AccessToken, creds.RefreshToken)
	}

	return nil, auth.NewCredentialsError("missing credentials")
}
