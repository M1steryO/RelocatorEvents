package auth

import (
	authModel "auth/internal/service/user/model/auth"
	jwtUtils "auth/internal/utils/jwt"
	descAuth "auth/pkg/auth_v1"
	"context"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (i *Implementation) GetAccessToken(ctx context.Context, req *descAuth.GetAccessTokenRequest) (*descAuth.GetAccessTokenResponse, error) {
	claims, err := jwtUtils.VerifyToken(
		req.GetRefreshToken(),
		[]byte(refreshTokenSecretKey),
	)
	if err != nil {
		return nil, status.Errorf(codes.Aborted, "invalid refresh token")
	}
	accessToken, err := jwtUtils.GenerateToken(authModel.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, []byte(accessTokenSecretKey),
		accessTokenExpiration)
	if err != nil {
		return nil, err
	}
	return &descAuth.GetAccessTokenResponse{
		AccessToken: accessToken,
	}, nil
}
