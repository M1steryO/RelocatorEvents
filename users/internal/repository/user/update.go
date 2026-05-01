package user

import (
	"context"
	"errors"
	"fmt"
	modelDomain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgx/v4"
	"strings"
)

func (s *repo) Update(ctx context.Context, userId int64, user *modelDomain.UpdateUser) error {
	q := db.Query{
		Title: "user_repository.Update",
	}

	setParts := make([]string, 0, 5)
	args := make([]any, 0, 6)

	addSet := func(column string, value any) {
		args = append(args, value)
		setParts = append(setParts, fmt.Sprintf("%s = $%d", column, len(args)))
	}

	if user.Name != nil {
		addSet("name", *user.Name)
	}

	if user.Email != nil {
		addSet("email", *user.Email)
	}

	args = append(args, userId)
	userIDArgNumber := len(args)

	query := fmt.Sprintf(`
		update users
		set %s
		where id = $%d
	`, strings.Join(setParts, ", "), userIDArgNumber)

	q.Query = query

	_, err := s.db.DB().ExecContext(ctx, q, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return modelDomain.ErrUserNotFound
		}

		return err
	}

	if user.AvatarURL != nil {
		q.Query = `update user_data set avatar_url = $1 where user_id = $2`
		_, err = s.db.DB().ExecContext(ctx, q, *user.AvatarURL, userId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return modelDomain.ErrUserNotFound
			}

			return err
		}
	}

	return nil
}
