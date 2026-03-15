package events

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/pkg/errors"
	"log/slog"
)

func (s *repo) Create(ctx context.Context, event *domain.Event, addressId int64) (int64, error) {
	q := db.Query{
		Title: "event_repository.Create",
		Query: `insert into events (title, description, link, min_age, seats_available, type, address_id, min_price, starts_at, image_url, currency)
				values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
	}
	var id int64
	err := s.db.DB().QueryRowContext(ctx, q, event.Title, event.Description,
		event.Link, event.MinAge, event.SeatsAvailable,
		event.Type.String(), addressId,
		event.MinPrice, event.StartsAt, event.ImageUrl, event.Currency).Scan(&id)
	if err != nil {
		return 0, errors.Wrap(err, q.Title)
	}

	return id, nil
}

func (s *repo) CreateEventAddress(ctx context.Context, event *domain.EventAddress) (int64, error) {
	q := db.Query{
		Title: "event_repository.CreateAddress",
		Query: `insert into event_address (venue_name, city, district, postal_code, country, full_address, latitude, longitude) 
				values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
	}
	var id int64
	err := s.db.DB().QueryRowContext(ctx, q, event.VenueName,
		event.City, event.District, event.PostalCode,
		event.Country, event.FullAddress,
		event.Latitude, event.Longitude).Scan(&id)

	if err != nil {
		return 0, errors.Wrap(err, q.Title)
	}

	return id, nil
}

func (s *repo) CreateEventCategory(ctx context.Context, eventId int64, categoryCode string) error {
	q := db.Query{
		Title: "event_repository.CreateEventCategory",
		Query: `INSERT INTO event_categories (event_id, category_id)
				SELECT $1, c.id
				FROM categories c
				WHERE c.code = $2
				ON CONFLICT (event_id, category_id) DO NOTHING;`,
	}

	rows, err := s.db.DB().ExecContext(ctx, q, eventId, categoryCode)
	if err != nil {
		return errors.Wrap(err, q.Title)
	}

	if rows.RowsAffected() == 0 {
		logger.Warn("event category not found",
			slog.Int64("event_id", eventId),
			slog.String("category_code", categoryCode))
	}
	return nil
}
