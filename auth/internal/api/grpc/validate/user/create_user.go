package create_user

import (
	desc "auth/pkg/user_v1"
	"context"
	"errors"
	"github.com/M1steryO/platform_common/pkg/sys/validate"
	"math/rand"
)

var errPasswordNotMatch = errors.New("password does not match")
var errInvalidTelegramToken = errors.New("invalid telegram token")

func isUserFromTelegram(req *desc.CreateRequest) bool {
	if req.TelegramToken != "" && req.Info.Email == "" && req.Password == "" {
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

func ValidateUserData(req *desc.CreateRequest, telegramId *int64) validate.Condition {
	return func(ctx context.Context) error {
		isFromTg := isUserFromTelegram(req)
		isFromWeb := isUserFromWeb(req)

		if isFromTg && !isFromWeb {
			tgId, err := validateTelegramToken(req.TelegramToken)
			if err != nil {
				return errInvalidTelegramToken
			}
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

func validateTelegramToken(token string) (int64, error) {
	// TODO
	n := rand.Int63()
	return n, nil
}
