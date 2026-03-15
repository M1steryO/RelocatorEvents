package auth

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/auth/internal/core/logger"
	models "github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/auth/v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"log/slog"
)

func (i *Implementation) GetAccessToken(ctx context.Context, req *descAuth.GetAccessTokenRequest) (*descAuth.GetAccessTokenResponse, error) {

	newAccessToken, err := i.authService.GetAccessToken(ctx, req.GetRefreshToken())
	if err != nil {
		var credentialsError *models.CredentialsError
		if errors.As(err, &credentialsError) {
			logger.Warn("invalid credentials", slog.Any("err", err))
			return nil, sys.NewCommonError(err.Error(), codes.InvalidArgument)
		}

		logger.Error("failed to get access token", slog.Any("err", err))
		return nil, sys.NewCommonError("internal error", codes.Internal)
	}
	return &descAuth.GetAccessTokenResponse{
		AccessToken: newAccessToken,
	}, nil
}
