package favourites

import (
	"context"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/pkg/errors"
)

func (r *repo) Check(ctx context.Context, eventId, userId int64) (bool, error) {
	q := db.Query{
		Title: "favourites_repository.Check",
		Query: `
			select exists(
				select 1
				from favourites
				where event_id = $1 and user_id = $2
			)
		`,
	}

	var exists bool

	err := r.db.DB().QueryRowContext(ctx, q, eventId, userId).Scan(&exists)
	if err != nil {
		return false, errors.Wrap(err, q.Title)
	}

	return exists, nil
}
