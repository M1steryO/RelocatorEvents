package auth

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/auth/internal/core/logger"
	models "github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/auth/v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"log/slog"
)

func detectAuthMethod(creds *models.Credentials) string {
	switch {
	case creds.InitData != "":
		return "telegram"
	case creds.RefreshToken != "" || creds.AccessToken != "":
		return "jwt"
	default:
		return "unknown"
	}
}

func (i *Implementation) Check(ctx context.Context, req *desc.CheckRequest) (*desc.CheckResponse, error) {
	creds := &models.Credentials{
		RefreshToken: req.GetRefreshToken(),
		AccessToken:  req.GetAccessToken(),
		InitData:     req.GetTelegramInitData(),
	}

	newCreds, err := i.authService.Check(ctx, creds)
	if err != nil {
		var credentialsError *models.CredentialsError
		if errors.As(err, &credentialsError) {
			logger.Warn("auth check failed", slog.Any("err", err), slog.String("auth_method", detectAuthMethod(creds)))
			return nil, sys.NewCommonError(err.Error(), codes.InvalidArgument)
		}
		logger.Error("failed to auth check", slog.Any("err", err), slog.String("auth_method", detectAuthMethod(creds)))
		return nil, sys.NewCommonError("internal error", codes.Internal)
	}

	return &desc.CheckResponse{
		RefreshToken: newCreds.RefreshToken,
		AccessToken:  newCreds.AccessToken,
		UserId:       newCreds.UserId,
	}, nil
}
