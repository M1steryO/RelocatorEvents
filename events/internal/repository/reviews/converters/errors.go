package converters

import (
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/reviews"
	"github.com/jackc/pgconn"
)

func PgErrorToDomain(pgErr *pgconn.PgError) error {
	switch pgErr.Code {
	case "23505": // unique_violation
		return domain.ErrReviewExists
	case "23503": // foreign_key_violation
		return domain.ErrInvalid
	}
	return nil
}
