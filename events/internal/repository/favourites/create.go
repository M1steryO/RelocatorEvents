package favourites

import (
	"context"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/pkg/errors"
)

func (r *repo) Create(ctx context.Context, eventId, userId int64) error {
	q := db.Query{
		Title: "favourites_repository.Create",
		Query: `insert into favourites (event_id,user_id) 
				values ($1, $2)
				on conflict (user_id, event_id) do nothing`,
	}
	_, err := r.db.DB().ExecContext(ctx,
		q, eventId, userId)
	if err != nil {
		return errors.Wrap(err, q.Title)
	}

	return nil
}
