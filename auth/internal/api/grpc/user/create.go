package user

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/auth/internal/api/grpc/converter"
	create_user "github.com/M1steryO/RelocatorEvents/auth/internal/api/grpc/validate/user"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/domain/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/logger"
	authModel "github.com/M1steryO/RelocatorEvents/auth/internal/service/user/model/auth"
	jwtUtils "github.com/M1steryO/RelocatorEvents/auth/internal/utils/jwt"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"github.com/M1steryO/platform_common/pkg/sys/validate"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"log/slog"
	"net/http"
	"time"
)

const tokenPrefix = "Bearer "
const refreshTokenExpiration = 10000 * time.Hour
const refreshTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g0="
const accessTokenSecretKey = "W4/X+LLjehdxptt4YgGFCvMpq5ewptpZZYRHY6A72g01"
const accessTokenExpiration = 10 * time.Minute

func (i *Implementation) Create(ctx context.Context, req *desc.CreateRequest) (*desc.CreateResponse, error) {
	var telegramId int64

	err := validate.Validate(ctx, create_user.ValidateUserData(req, &telegramId, i.telegramAuth))
	if err != nil {
		return nil, err
	}

	id, err := i.service.Create(ctx, converter.ToCreateUserDtoInfoFromApi(req, &telegramId))
	if err != nil {
		if errors.Is(err, domain.ErrUserExists) {
			return nil, sys.NewCommonError("user already exists", codes.AlreadyExists)
		}
		return nil, err
	}

	accessToken, err := jwtUtils.GenerateToken(authModel.UserInfo{Id: id, Role: "user"}, []byte(accessTokenSecretKey), accessTokenExpiration)
	if err != nil {
		logger.Info("failed to generate access token:", slog.Any("error", err))
		return nil, sys.NewCommonError("failed to generate token", codes.Internal)
	}

	refreshToken, err := jwtUtils.GenerateToken(authModel.UserInfo{Id: id, Role: "user"}, []byte(refreshTokenSecretKey), refreshTokenExpiration)
	if err != nil {
		logger.Info("failed to generate refresh token:", slog.Any("error", err))
		return nil, sys.NewCommonError("failed to refresh token", codes.Internal)
	}

	cookie := (&http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode, // TODO: поменятть !!!!
	}).String()

	header := metadata.Pairs(
		"Authorization", tokenPrefix+accessToken,
		"Set-Cookie", cookie,
	)
	err = grpc.SendHeader(ctx, header)

	if err != nil {
		logger.Info("failed to send access token header:", slog.Any("error", err))
		return nil, sys.NewCommonError("failed to send access token header", codes.Internal)
	}

	return &desc.CreateResponse{
		Id:           id,
		RefreshToken: refreshToken,
		AccessToken:  accessToken,
	}, nil
}
