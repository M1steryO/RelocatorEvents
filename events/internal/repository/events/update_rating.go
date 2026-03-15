package events

import (
	"context"
	"fmt"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/pkg/errors"
)

func (s *repo) UpdateRating(ctx context.Context, eventId int64, grade int) error {

	q := db.Query{
		Title: "event_repository.UpdateRating",
		Query: `update events 
				set reviews_count = reviews_count + 1,
				rating_sum    = rating_sum + $1,
  				rating = round((rating_sum + $1)::numeric / (reviews_count + 1), 2)
				where id = $2`,
	}

	res, err := s.db.DB().ExecContext(ctx, q, grade, eventId)
	if err != nil {
		return errors.Wrap(err, q.Title)
	}
	n := res.RowsAffected()
	if n == 0 {
		return errors.Wrap(fmt.Errorf("rows affected 0"), q.Title)
	}
	return err
}
