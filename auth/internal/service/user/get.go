package user

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
)

func (s *serv) Get(ctx context.Context, id int64) (*domain.User, error) {
	user, err := s.db.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	return user, nil
}
