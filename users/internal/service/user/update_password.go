package user

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/users/internal/service/user/dto"
	"golang.org/x/crypto/bcrypt"
)

func (s *serv) UpdatePassword(ctx context.Context, userId int64, passwords *dto.UpdatePassword) error {
	hashedOldPassword, err := bcrypt.GenerateFromPassword([]byte(passwords.OldPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	hashedNewPassword, err := bcrypt.GenerateFromPassword([]byte(passwords.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	err = s.txManager.ReadCommitted(ctx, func(ctx context.Context) error {
		user, err := s.db.Get(ctx, userId)
		if err != nil {
			return err
		}

		if user.Password != string(hashedOldPassword) {
			return domain.ErrIncorrectOldPassword
		}

		err = s.db.UpdatePassword(ctx, userId, string(hashedNewPassword))
		if err != nil {
			return err
		}

		return nil
	})
	return err
}
