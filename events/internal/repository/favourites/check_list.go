package favourites

import (
	"context"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/pkg/errors"
)

func (r *repo) CheckList(ctx context.Context, eventIds []int64, userId int64) (map[int64]bool, error) {
	data := make(map[int64]bool, len(eventIds))

	q := db.Query{
		Title: "favourites_repository.CheckList",
		Query: `
			select event_id from favourites
			where event_id = any($1) and user_id = $2
		`,
	}
	var favourites []int64

	err := r.db.DB().ScanAllContext(ctx, &favourites, q, eventIds, userId)
	if err != nil {
		return nil, errors.Wrap(err, q.Title)
	}

	for _, eventId := range favourites {
		data[eventId] = true
	}

	return data, nil
}
