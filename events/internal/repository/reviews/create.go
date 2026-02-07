package reviews

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/reviews"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository/reviews/converters"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgconn"
	"github.com/pkg/errors"
)

func (r *repo) Create(ctx context.Context, eventId int64, authorId int64, review *domain.Review) (int64, error) {
	var reviewId int64
	q := db.Query{
		Title: "review_repository.Create",
		Query: `insert into reviews (event_id, author_id, grade, advantages, disadvantages, text) 
				values ($1, $2, $3, $4, $5, $6) returning id`,
	}
	err := r.db.DB().QueryRowContext(ctx,
		q, eventId, authorId, review.Grade, review.Advantages,
		review.Disadvantages, review.Text).Scan(&reviewId)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23503": // foreign_key_violation

				if pgErr.ConstraintName == "reviews_event_id_fkey" {
					return 0, errors.Wrap(
						events.ErrEventNotFound,
						q.Title,
					)
				}
				return 0, errors.Wrap(pgErr, q.Title)

			default:
				if derr := converters.PgErrorToDomain(pgErr); derr != nil {
					return 0, errors.Wrapf(derr, "%s: %s", q.Title, pgErr.Message)
				}
				return 0, errors.Wrap(pgErr, q.Title)
			}
		}
	}

	return reviewId, nil
}
