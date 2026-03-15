package events

import (
	"context"
	"errors"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository/events/converters"
	repoModel "github.com/M1steryO/RelocatorEvents/events/internal/repository/events/model"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgx/v4"
)

func (s *repo) Get(ctx context.Context, id int64) (*domain.Event, error) {
	event := &repoModel.Event{}
	q := db.Query{
		Title: "event_repository.Get",
		Query: `select e.id, e.title, e.description, e.link, e.rating, 
				   e.reviews_count, e.ratings_count, e.min_age, e.min_price,
				   e.seats_available, e.type, e.starts_at, e.image_url, e.currency,
				     ea.venue_name,ea.city,  ea.district,  ea.postal_code,  ea.country,  ea.full_address,  ea.latitude,  ea.longitude
				from events e
				left join event_address ea on e.address_id = ea.id
				where e.id = $1
				`,
	}
	err := s.db.DB().ScanOneContext(ctx, event, q, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrEventNotFound
		}
		return nil, err
	}
	return converters.EventToDomainFromRepo(event), nil
}
