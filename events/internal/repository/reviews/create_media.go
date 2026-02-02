package reviews

import (
	"context"
	domain "events/internal/domain/reviews"
	"events/internal/repository/reviews/converters"
	"fmt"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgconn"
	"github.com/pkg/errors"
	"strings"
)

func (r *repo) CreateMedia(ctx context.Context, reviewId int64, media []*domain.MediaAttachment) error {
	if len(media) == 0 {
		return nil
	}

	var (
		args []any
		sb   strings.Builder
	)

	sb.WriteString(`insert into reviews_media (review_id, storage_key, media_type) values `)

	argPos := 1
	row := 0

	for _, m := range media {

		if m == nil {
			continue
		}

		if row > 0 {
			sb.WriteString(",")
		}

		sb.WriteString(fmt.Sprintf("($%d,$%d,$%d)", argPos, argPos+1, argPos+2))
		args = append(args, reviewId, m.StorageKey, string(m.Type))
		argPos += 3
		row++
	}

	if row == 0 {
		return nil
	}

	q := db.Query{
		Title: "review_repository.CreateMedia",
		Query: sb.String(),
	}
	_, err := r.db.DB().ExecContext(ctx, q, args...)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if err := converters.PgErrorToDomain(pgErr); err != nil {
				return errors.Wrap(err, q.Title)
			}
			return errors.Wrap(pgErr, q.Title)
		}

		wrapped := errors.Wrap(err, q.Title)
		return wrapped
	}

	return nil
}
