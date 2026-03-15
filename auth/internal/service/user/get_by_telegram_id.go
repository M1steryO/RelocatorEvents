package user

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
)

func (s *serv) GetByTelegramId(ctx context.Context, telegramId int64) (*domain.User, error) {
	user, err := s.db.GetByTelegramId(ctx, telegramId)
	if err != nil {
		return nil, err
	}
	return user, nil
}
