package events

import (
	"context"
	"fmt"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository/events/converters"
	repoModel "github.com/M1steryO/RelocatorEvents/events/internal/repository/events/model"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgx/v4"
	"github.com/pkg/errors"
	"strings"
	"time"
)

const constraintErrorCode = "23505"

type repo struct {
	db db.Client
}

func NewEventRepository(db db.Client) *repo {
	return &repo{
		db: db,
	}
}

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
		logger.Warn("event category not found")
	}
	return nil
}
func (s *repo) GetList(ctx context.Context, params *domain.SearchParams, country string) ([]*domain.Event, error) {
	events := make([]*repoModel.Event, 0)

	var filters []interface{}
	var conditions []string

	q := db.Query{
		Title: "event_repository.GetList",
		Query: `select e.id, e.title, e.description, e.link, e.rating, 
				   e.reviews_count, e.ratings_count, e.min_age, e.min_price,
				   e.seats_available, e.type, e.starts_at, e.image_url, e.currency
				from events e
				left join event_address ea on e.address_id = ea.id`,
	}
	idx := 1

	if params != nil {
		if params.Categories != nil {
			conditions = append(conditions, fmt.Sprintf(`
					EXISTS (
					SELECT 1 FROM event_categories ec
					JOIN categories c ON ec.category_id = c.id
					WHERE ec.event_id = e.id AND c.code = ANY($%d)
					)`, idx))
			filters = append(filters, params.Categories)
			idx += 1

		}
		if params.Q != nil {
			conditions = append(conditions, fmt.Sprintf("e.title ILIKE '%%' || $%d || '%%'", idx))
			filters = append(filters, *params.Q)
			idx++
		}

		if params.City != nil {
			conditions = append(conditions, fmt.Sprintf("ea.city = $%d", idx))
			filters = append(filters, *params.City)
			idx++
		}

		if params.District != nil {
			conditions = append(conditions, fmt.Sprintf("ea.district = $%d", idx))
			filters = append(filters, *params.District)
			idx++
		}

		if params.MinPrice != nil {
			conditions = append(conditions, fmt.Sprintf("e.min_price >= $%d", idx))
			filters = append(filters, *params.MinPrice)
			idx++
		}

		if params.MaxPrice != nil {
			conditions = append(conditions, fmt.Sprintf("e.min_price <= $%d", idx))
			filters = append(filters, *params.MaxPrice)
			idx++
		}

		const TZ = "Europe/Moscow" // TODO getting timezone from client
		if params.EventDate != nil {
			startDate, endDate := params.EventDate.ToRange(TZ)
			conditions = append(conditions, fmt.Sprintf("e.starts_at between $%d and $%d", idx, idx+1))
			filters = append(filters, startDate, endDate)
			idx += 2
		} else {
			now := time.Now()
			conditions = append(conditions, fmt.Sprintf("e.starts_at > $%d", idx))
			filters = append(filters, now)
			idx++
		}

		if params.EventType != nil {
			conditions = append(conditions, fmt.Sprintf("e.type = $%d", idx))
			filters = append(filters, params.EventType.String())
			idx++
		}

		if params.LastID != nil {
			conditions = append(conditions, fmt.Sprintf("e.id > $%d", idx))
			filters = append(filters, *params.LastID)
			idx++
		}

		if country != "" {
			conditions = append(conditions, fmt.Sprintf("ea.country = $%d", idx))
			filters = append(filters, country)
			idx++
		}

		if len(conditions) > 0 {
			q.Query += " WHERE " + strings.Join(conditions, " AND ")
		}
		if params.Sort != nil {
			switch *params.Sort {
			case "popular":
				q.Query += " ORDER BY e.id"
				break
			case "rating":
				q.Query += " ORDER BY e.rating"
				break
			case "price_asc":
				q.Query += " ORDER BY e.min_price"
				break
			case "price_desc":
				q.Query += " ORDER BY e.min_price DESC"
				break
			case "new":
				q.Query += " ORDER BY e.created_at DESC"
			}
		}
		if params.Offset != nil {
			q.Query += fmt.Sprintf(" OFFSET $%d", idx)
			filters = append(filters, *params.Offset)
			idx++
		}

		if params.Limit != nil {
			q.Query += fmt.Sprintf(" LIMIT $%d", idx)
			filters = append(filters, *params.Limit)
		}

	}

	err := s.db.DB().ScanAllContext(ctx, &events, q, filters...)

	if err != nil {
		return nil, err
	}

	return converters.EventsFromRepoToDomain(events), nil
}
func (s *repo) GetFiltersData(ctx context.Context, userCountry string) (*domain.FiltersData, error) {
	data := &repoModel.FiltersData{}
	q := db.Query{
		Title: "event_repository.GetFiltersData",
		Query: `select min(e.min_price) as min_price, max(e.min_price) as max_price, 
       			COALESCE(array_agg(distinct ea.city), '{}') as cities,
       			COALESCE(jsonb_agg(
                        DISTINCT jsonb_build_object(
                       'code', ca.code,
                       'title', ca.title)) FILTER (WHERE ca.id IS NOT NULL), '[]'::jsonb) AS categories
				from events e
				left join event_address ea on e.address_id = ea.id
				left join event_categories ec on e.id = ec.event_id
				left join categories ca on ec.category_id = ca.id
				where ea.country = $1 and ea.city != '' and e.starts_at > now()
				`,
	}
	err := s.db.DB().ScanOneContext(ctx, data, q, userCountry)
	if err != nil {
		return nil, err
	}
	return converters.FiltersFromRepoToDomain(data), nil
}
