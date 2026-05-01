package user

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/users/internal/service/user/dto"
)

func (s *serv) Update(ctx context.Context, userId int64, user *dto.UpdateUser) error {
	err := s.db.Update(ctx, userId, user.ToDomain())
	return err
}
