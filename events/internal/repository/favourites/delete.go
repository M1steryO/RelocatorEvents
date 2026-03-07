package favourites

import (
	"context"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/pkg/errors"
)

func (r *repo) Delete(ctx context.Context, eventId, userId int64) error {
	q := db.Query{
		Title: "favourites_repository.Delete",
		Query: `
			delete from favourites
			where event_id = $1 and user_id = $2
		`,
	}

	_, err := r.db.DB().ExecContext(ctx, q, eventId, userId)
	if err != nil {
		return errors.Wrap(err, q.Title)
	}

	return nil
}
