package user

import (
	"context"
	"errors"
	modelDomain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgx/v4"
)

func (s *repo) UpdatePassword(ctx context.Context, userId int64, password string) error {
	q := db.Query{
		Title: "user_repository.UpdatePassword",
		Query: `update users set password = $1 where id = $2`,
	}

	_, err := s.db.DB().ExecContext(ctx, q, password, userId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return modelDomain.ErrUserNotFound
		}

		return err
	}

	return nil
}
