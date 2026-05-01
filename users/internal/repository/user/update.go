package user

import (
	"context"
	"fmt"
	modelDomain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/platform_common/pkg/db"
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

	if len(setParts) > 0 {
		args = append(args, userId)
		userIDArgNumber := len(args)

		q.Query = fmt.Sprintf(`
			update users
			set %s
			where id = $%d
		`, strings.Join(setParts, ", "), userIDArgNumber)

		tag, err := s.db.DB().ExecContext(ctx, q, args...)
		if err != nil {
			return err
		}

		if tag.RowsAffected() == 0 {
			return modelDomain.ErrUserNotFound
		}
	}

	if user.AvatarURL != nil {
		q.Query = `
			update user_data 
			set avatar_url = $1 
			where user_id = $2
		`

		tag, err := s.db.DB().ExecContext(ctx, q, *user.AvatarURL, userId)
		if err != nil {
			return err
		}

		if tag.RowsAffected() == 0 {
			return modelDomain.ErrUserNotFound
		}
	}

	return nil
}
