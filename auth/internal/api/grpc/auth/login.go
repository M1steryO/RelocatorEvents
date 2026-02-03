package auth

import (
	"context"
	"errors"
	authModel "github.com/M1steryO/RelocatorEvents/auth/internal/service/user/model/auth"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/utils/jwt"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"time"
)

const refreshTokenExpiration = 60 * time.Minute
const refreshTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g0="
const accessTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g01"
const accessTokenExpiration = 10 * time.Minute

func (i *Implementation) Login(ctx context.Context, req *descAuth.LoginRequest) (*descAuth.LoginResponse, error) {
	role := "ADMIN" // Get user role from db
	refreshToken, err := jwtUtils.GenerateToken(authModel.UserInfo{
		Id:   124,
		Role: role,
	},
		[]byte(refreshTokenSecretKey),
		refreshTokenExpiration)

	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &descAuth.LoginResponse{
		RefreshToken: refreshToken,
	}, nil
}
