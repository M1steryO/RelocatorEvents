package user

import (
	domain "auth/internal/domain/user"
	"context"
)

func (s *serv) Get(ctx context.Context, id int64) (*domain.User, error) {
	user, err := s.db.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	return user, nil
}
