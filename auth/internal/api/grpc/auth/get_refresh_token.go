package auth

import (
	authModel "auth/internal/service/user/model/auth"
	jwtUtils "auth/internal/utils/jwt"
	descAuth "auth/pkg/auth_v1"
	"context"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (i *Implementation) GetRefreshToken(ctx context.Context, req *descAuth.GetRefreshTokenRequest) (*descAuth.GetRefreshTokenResponse, error) {
	claims, err := jwtUtils.VerifyToken(
		req.GetOldRefreshToken(),
		[]byte(refreshTokenSecretKey),
	)
	if err != nil {
		return nil, status.Errorf(codes.Aborted, "invalid refresh to	ken: %s", err.Error())
	}
	refreshToken, err := jwtUtils.GenerateToken(authModel.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, []byte(refreshTokenSecretKey),
		refreshTokenExpiration)
	if err != nil {
		return nil, err
	}
	return &descAuth.GetRefreshTokenResponse{
		RefreshToken: refreshToken,
	}, nil
}
