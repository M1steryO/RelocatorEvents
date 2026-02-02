package access

import (
	authModel "auth/internal/service/user/model/auth"
	jwtUtils "auth/internal/utils/jwt"
	desc "auth/pkg/access_v1"
	"context"
	"errors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"net/http"
	"regexp"
	"strings"
	"time"
)

const tokenPrefix = "Bearer "
const refreshTokenExpiration = 10000 * time.Hour
const refreshTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g0="
const accessTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g01"
const accessTokenExpiration = 10 * time.Minute

var refreshTokenRe = regexp.MustCompile(`(?:^|;\s*)refresh_token=([^;]+)`)

func resetAccessToken(ctx context.Context, md metadata.MD) (int64, error) {
	cookieHeader, ok := md["cookie"]
	if !ok || len(cookieHeader) == 0 {
		return 0, errors.New("cookie is not provided")
	}
	req := &http.Request{Header: http.Header{"Cookie": []string{cookieHeader[0]}}}

	c, err := req.Cookie("refresh_token")
	if err != nil {
		return 0, errors.New("refresh token not found")
	}

	claims, err := jwtUtils.VerifyToken(c.Value, []byte(refreshTokenSecretKey))
	if err != nil {
		return 0, errors.New("invalid refresh token")
	}
	newAccessToken, err := jwtUtils.GenerateToken(authModel.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, []byte(accessTokenSecretKey), accessTokenExpiration)
	if err != nil {
		return 0, errors.New("failed to generate token")
	}
	newRefreshToken, err := jwtUtils.GenerateToken(authModel.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, []byte(refreshTokenSecretKey), refreshTokenExpiration)
	if err != nil {
		return 0, errors.New("failed to generate token")
	}

	cookie := (&http.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	}).String()

	header := metadata.Pairs(
		"Authorization", tokenPrefix+newAccessToken,
		"Set-Cookie", cookie,
	)
	err = grpc.SendHeader(ctx, header)
	return claims.Id, nil
}

func (i *Implementation) Check(ctx context.Context, req *desc.CheckRequest) (*desc.CheckResponse, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("metadata is not provided")
	}
	authHeader, ok := md["authorization"]
	if !ok || len(authHeader) == 0 {
		userId, err := resetAccessToken(ctx, md)
		if err != nil {
			return nil, status.Error(codes.Unauthenticated, err.Error())
		}
		return &desc.CheckResponse{
			UserId: userId,
		}, nil
	}

	if !strings.HasPrefix(authHeader[0], tokenPrefix) {
		return nil, status.Error(codes.Unauthenticated, "invalid authorization header")
	}

	accessToken := strings.TrimPrefix(authHeader[0], tokenPrefix)

	claims, err := jwtUtils.VerifyToken(accessToken, []byte(accessTokenSecretKey))
	if err != nil {
		userId, err := resetAccessToken(ctx, md)
		if err != nil {
			return nil, err
		}
		return &desc.CheckResponse{
			UserId: userId,
		}, nil
	}

	return &desc.CheckResponse{
		UserId: claims.Id,
	}, nil
}
