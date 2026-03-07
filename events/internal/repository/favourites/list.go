package favourites

import (
	"context"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/pkg/errors"
)

func (r *repo) List(ctx context.Context, userId int64) ([]int64, error) {
	var ids []int64

	q := db.Query{
		Title: "favourites_repository.List",
		Query: `select event_id from favourites where user_id = $1 order by created_at desc`,
	}
	err := r.db.DB().ScanAllContext(ctx, &ids, q, userId)
	if err != nil {
		return nil, errors.Wrap(err, q.Title)
	}

	return ids, nil
}
