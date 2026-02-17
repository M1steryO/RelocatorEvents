package create_user

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/auth/internal/logger"
	"github.com/M1steryO/RelocatorEvents/auth/internal/utils/telegram"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
	"github.com/M1steryO/platform_common/pkg/sys/validate"
	"time"
)

var errPasswordNotMatch = errors.New("password does not match")
var errInvalidTelegramToken = errors.New("invalid telegram token")

func isUserFromTelegram(req *desc.CreateRequest) bool {
	if req.TelegramToken != "" && req.Info.Email == nil && req.Password == "" {
		return true
	}
	return false
}

func isUserFromWeb(req *desc.CreateRequest) bool {
	if req.TelegramToken == "" && req.Info.TelegramUsername == "" {
		return true
	}
	return false
}

func ValidateUserData(req *desc.CreateRequest, telegramId *int64, telegramAuth *telegram.TelegramAuthenticator) validate.Condition {
	return func(ctx context.Context) error {
		isFromTg := isUserFromTelegram(req)
		isFromWeb := isUserFromWeb(req)

		if isFromTg && !isFromWeb {
			tgId, err := validateTelegramToken(req.TelegramToken, telegramAuth)
			if err != nil {
				return errInvalidTelegramToken
			}
			logger.Info("get telegram id from token: ", "id", tgId)
			*telegramId = tgId

			return nil
		}
		if isFromWeb && !isFromTg {
			if req.Password != req.PasswordConfirm {
				return errPasswordNotMatch
			}
			return nil
		}
		return validate.NewValidationErrors("user not from web or telegram")
	}
}

func validateTelegramToken(token string, telegramAuth *telegram.TelegramAuthenticator) (int64, error) {
	clearData, err := telegramAuth.Validate(token, 5000000*time.Minute)
	if err != nil {
		return 0, errors.New("invalid init data")
	}
	if clearData.User == nil {
		return 0, errors.New("user-data is not provided")
	}

	telegramID := clearData.User.ID
	return telegramID, nil
}
