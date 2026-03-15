package auth

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/auth/internal/core/logger"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
	descAuth "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/auth/v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"log/slog"
)

func (i *Implementation) TelegramLogin(ctx context.Context, req *descAuth.TelegramLoginRequest) (*descAuth.TelegramLoginReponse, error) {
	creds, err := i.authService.TelegramLogin(ctx, req.GetTelegramId())
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			logger.Warn("user not found", slog.Any("err", err))
			return nil, sys.NewCommonError(err.Error(), codes.InvalidArgument)
		}
		logger.Error("failed to get refresh token", slog.Any("err", err))
		return nil, sys.NewCommonError("internal error", codes.Internal)
	}

	return &descAuth.TelegramLoginReponse{
		RefreshToken: creds.RefreshToken,
		AccessToken:  creds.AccessToken,
	}, nil
}
