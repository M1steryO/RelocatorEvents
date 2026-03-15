package events

import (
	"context"
	"fmt"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository/events/converters"
	repoModel "github.com/M1steryO/RelocatorEvents/events/internal/repository/events/model"
	"github.com/M1steryO/platform_common/pkg/db"
	"strings"
	"time"
)

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

		const TZ = "Europe/Moscow" // TODO: getting timezone from client

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
				break

			case "random":
				q.Query += " ORDER BY RANDOM()"
				break
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
