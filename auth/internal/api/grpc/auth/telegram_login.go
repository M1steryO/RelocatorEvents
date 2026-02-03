package auth

import (
	"context"
	"errors"
	userRepo "github.com/M1steryO/RelocatorEvents/auth/internal/repository/user"
	authModel "github.com/M1steryO/RelocatorEvents/auth/internal/service/user/model/auth"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/utils/jwt"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (i *Implementation) TelegramLogin(ctx context.Context, req *descAuth.TelegramLoginRequest) (*descAuth.TelegramLoginReponse, error) {
	role := "ADMIN" // Get user role from db

	user, err := i.service.GetByTelegramId(ctx, req.GetTelegramId())
	if err != nil {
		if errors.Is(err, userRepo.ErrUserNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, err
	}

	userInfo := authModel.UserInfo{
		Id:   user.ID,
		Role: role,
	}

	refreshToken, err := jwtUtils.GenerateToken(userInfo, []byte(refreshTokenSecretKey), refreshTokenExpiration)

	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	accessToken, err := jwtUtils.GenerateToken(userInfo, []byte(accessTokenSecretKey), accessTokenExpiration)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &descAuth.TelegramLoginReponse{
		RefreshToken: refreshToken,
		AccessToken:  accessToken,
	}, nil
}
