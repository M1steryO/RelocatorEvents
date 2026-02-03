package access

import (
	"context"
	"errors"
	authModel "github.com/M1steryO/RelocatorEvents/auth/internal/service/user/model/auth"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/utils/jwt"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/access_v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"net/http"
	"strings"
	"time"
)

const tokenPrefix = "Bearer "
const refreshTokenExpiration = 10000 * time.Hour
const refreshTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g0="
const accessTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g01"
const accessTokenExpiration = 10 * time.Minute

func generateTokens(id int64, role string) ([]string, error) {
	var tokens []string

	newAccessToken, err := jwtUtils.GenerateToken(authModel.UserInfo{
		Id:   id,
		Role: role,
	}, []byte(accessTokenSecretKey), accessTokenExpiration)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}
	tokens = append(tokens, newAccessToken)

	newRefreshToken, err := jwtUtils.GenerateToken(authModel.UserInfo{
		Id:   id,
		Role: role,
	}, []byte(refreshTokenSecretKey), refreshTokenExpiration)

	if err != nil {
		return nil, errors.New("failed to generate token")
	}
	tokens = append(tokens, newRefreshToken)
	return tokens, nil
}
func setTokens(ctx context.Context, id int64, role string) error {
	newTokens, err := generateTokens(id, role)
	if err != nil {
		return err
	}

	newAccessToken, newRefreshToken := newTokens[0], newTokens[1]

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

	return err
}
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
	err = setTokens(ctx, claims.Id, claims.Role)
	if err != nil {
		return 0, err
	}

	return claims.Id, nil
}

func (i *Implementation) checkTelegramInitData(ctx context.Context, md metadata.MD) (int64, error) {
	initData, ok := md["x-telegram-init-data"]
	if !ok || len(initData) == 0 {
		return 0, errors.New("init-data is not provided")
	}
	clearData, err := i.telegramAuth.Validate(initData[0], 500*time.Hour)
	if err != nil {
		return 0, err
	}
	if clearData.User == nil {
		return 0, errors.New("user-data is not provided")
	}
	telegramId := clearData.User.ID
	user, err := i.service.GetByTelegramId(ctx, telegramId)
	if err != nil {
		return 0, err
	}
	err = setTokens(ctx, user.ID, "user")
	if err != nil {
		return 0, err
	}
	return user.ID, nil
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
			userId, err = i.checkTelegramInitData(ctx, md)
			if err != nil {
				return nil, status.Error(codes.Unauthenticated, err.Error())
			}
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
		// только если токен expires
		userId, err := resetAccessToken(ctx, md)
		if err != nil {
			userId, err = i.checkTelegramInitData(ctx, md)
			if err != nil {
				return nil, status.Error(codes.Unauthenticated, err.Error())
			}
		}
		return &desc.CheckResponse{
			UserId: userId,
		}, nil
	}

	return &desc.CheckResponse{
		UserId: claims.Id,
	}, nil
}
