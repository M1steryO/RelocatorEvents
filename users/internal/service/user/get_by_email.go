package user

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
)

func (s *serv) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	user, err := s.db.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	return user, nil
}
