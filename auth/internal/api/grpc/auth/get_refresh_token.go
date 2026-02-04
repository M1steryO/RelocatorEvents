package auth

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/model/auth"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/utils/jwt"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (i *Implementation) GetRefreshToken(ctx context.Context, req *descAuth.GetRefreshTokenRequest) (*descAuth.GetRefreshTokenResponse, error) {
	claims, err := jwtUtils.VerifyToken(
		req.GetOldRefreshToken(),
		i.jwtConfig.RefreshSecret(),
	)
	if err != nil {
		return nil, status.Errorf(codes.Aborted, "invalid refresh to	ken: %s", err.Error())
	}
	refreshToken, err := jwtUtils.GenerateToken(auth.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, i.jwtConfig.RefreshSecret(),
		i.jwtConfig.RefreshExpiration())
	if err != nil {
		return nil, err
	}
	return &descAuth.GetRefreshTokenResponse{
		RefreshToken: refreshToken,
	}, nil
}
