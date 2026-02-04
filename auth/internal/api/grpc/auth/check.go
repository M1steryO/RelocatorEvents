package auth

import (
	"context"
	"errors"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/domain/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/model/auth"
	"time"

	"github.com/M1steryO/RelocatorEvents/auth/internal/logger"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/utils/jwt"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type tokenPair struct {
	access  string
	refresh string
}

func (i *Implementation) issueTokens(userID int64, role string) (tokenPair, error) {
	userInfo := auth.UserInfo{
		Id:   userID,
		Role: role,
	}

	access, err := jwtUtils.GenerateToken(userInfo, i.jwtConfig.AccessSecret(), i.jwtConfig.AccessExpiration())
	if err != nil {
		logger.Error("failed to generate access token", "err", err.Error())
		return tokenPair{}, status.Error(codes.Internal, "failed to generate access token")
	}

	refresh, err := jwtUtils.GenerateToken(userInfo, i.jwtConfig.RefreshSecret(), i.jwtConfig.RefreshExpiration())
	if err != nil {
		logger.Error("failed to generate refresh token", "err", err.Error())
		return tokenPair{}, status.Error(codes.Internal, "failed to generate refresh token")
	}

	return tokenPair{access: access, refresh: refresh}, nil
}

func (i *Implementation) handleTelegram(ctx context.Context, initData string) (*desc.CheckResponse, error) {
	clearData, err := i.telegramAuth.Validate(initData, 5*time.Minute)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid init data")
	}
	if clearData.User == nil {
		return nil, status.Error(codes.Unauthenticated, "user-data is not provided")
	}

	telegramID := clearData.User.ID
	user, err := i.service.GetByTelegramId(ctx, telegramID)
	if err != nil {
		logger.Error("failed to get user", "err", err.Error())
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, status.Error(codes.Unauthenticated, "user not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}

	role := "ADMIN" // TODO: брать из user
	tp, err := i.issueTokens(user.ID, role)
	if err != nil {
		logger.Error("failed to issue tokens", "err", err.Error())
		return nil, err
	}

	return &desc.CheckResponse{
		UserId:       user.ID,
		AccessToken:  tp.access,
		RefreshToken: tp.refresh,
	}, nil
}

func (i *Implementation) handleJWT(_ context.Context, accessToken, refreshToken string) (*desc.CheckResponse, error) {
	if accessToken != "" {
		claims, err := jwtUtils.VerifyToken(accessToken, i.jwtConfig.AccessSecret())
		if err == nil {
			return &desc.CheckResponse{UserId: claims.Id}, nil
		}

		if !errors.Is(err, jwt.ErrTokenExpired) {
			logger.Error("failed to verify token", "err", err.Error())
			return nil, status.Error(codes.Unauthenticated, "invalid access token")
		}
	}

	refreshClaims, err := jwtUtils.VerifyToken(refreshToken, i.jwtConfig.RefreshSecret())
	if err != nil {
		logger.Error("failed to verify refresh token", "err", err.Error())
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, status.Error(codes.Unauthenticated, "refresh token expired")
		}
		return nil, status.Error(codes.Unauthenticated, "invalid refresh token")
	}

	tp, err := i.issueTokens(refreshClaims.Id, refreshClaims.Role)
	if err != nil {
		return nil, err
	}

	return &desc.CheckResponse{
		UserId:       refreshClaims.Id,
		AccessToken:  tp.access,
		RefreshToken: tp.refresh,
	}, nil
}

func (i *Implementation) Check(ctx context.Context, req *desc.CheckRequest) (*desc.CheckResponse, error) {
	initData := req.GetTelegramInitData()
	if initData != "" {
		return i.handleTelegram(ctx, initData)
	}

	accessToken := req.GetAccessToken()
	refreshToken := req.GetRefreshToken()
	if refreshToken != "" {
		return i.handleJWT(ctx, accessToken, refreshToken)
	}

	logger.Info("missing credentials in request")
	return nil, status.Error(codes.Unauthenticated, "missing credentials")
}
