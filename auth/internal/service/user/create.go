package user

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/dto"
	"golang.org/x/crypto/bcrypt"
)

func (s *serv) Create(ctx context.Context, user *dto.CreateUser) (int64, error) {
	password, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return 0, errors.New("failed to generate password: " + err.Error())
	}

	user.Password = string(password)

	var id int64
	err = s.txManager.ReadCommitted(ctx, func(ctx context.Context) error {
		repoUser := user.ToRepo(user.TelegramId)

		id, err = s.db.Create(ctx, repoUser)
		if err != nil {
			return err
		}

		err = s.db.CreateUserData(ctx, id, user.TelegramUsername, repoUser.Info)
		if err != nil {
			return err
		}

		var interestsIds []int64
		interestsIds, err = s.db.GetInterestsByCodes(ctx, user.Interests)
		if err != nil {
			return err
		}

		err = s.db.CreateUserInterests(ctx, id, interestsIds)
		return err
	})
	if err != nil {
		return 0, err
	}
	return id, nil
}
