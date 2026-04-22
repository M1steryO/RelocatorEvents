package auth

import (
	"context"
	"errors"
	models "github.com/M1steryO/RelocatorEvents/auth/internal/models/auth"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"golang.org/x/crypto/bcrypt"
)

func (s *serv) Login(ctx context.Context, email, password string) (*models.Credentials, error) {
	user, err := s.userService.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, sys.NewCommonError("wrong email", codes.NotFound)
		}
		return nil, err
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	if string(hashedPassword) != user.Password {
		return nil, sys.NewCommonError("wrong password", codes.InvalidArgument)
	}

	creds, err := s.issueTokens(user.ID, "admin")
	if err != nil {
		return nil, err
	}
	return &creds, nil

}
