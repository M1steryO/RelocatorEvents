package user

import (
	"context"
	"errors"
	modelDomain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgx/v4"
)

func (s *repo) Delete(ctx context.Context, userId int64) error {
	q := db.Query{
		Title: "user_repository.Delete",
		Query: `delete from users where id = $1`,
	}

	_, err := s.db.DB().ExecContext(ctx, q, userId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return modelDomain.ErrUserNotFound
		}

		return err
	}
	return nil
}
