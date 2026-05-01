package user

import (
	"context"
	"errors"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/users/internal/service/user/dto"
	"golang.org/x/crypto/bcrypt"
)

func (s *serv) UpdatePassword(ctx context.Context, userId int64, passwords *dto.UpdatePassword) error {

	hashedNewPassword, err := bcrypt.GenerateFromPassword([]byte(passwords.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	
	err = s.txManager.ReadCommitted(ctx, func(ctx context.Context) error {
		user, err := s.db.Get(ctx, userId)
		if err != nil {
			return err
		}

		if err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(passwords.OldPassword)); err != nil {
			if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {

				return domain.ErrIncorrectOldPassword
			}
			return err
		}

		err = s.db.UpdatePassword(ctx, userId, string(hashedNewPassword))
		if err != nil {
			return err
		}

		return nil
	})
	return err
}
