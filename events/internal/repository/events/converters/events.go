package converters

import (
	"database/sql"
	domain "events/internal/domain/events"
	repoModel "events/internal/repository/events/model"
	"time"
)

func timeToBasic(t sql.NullTime) *time.Time {
	if t.Valid {
		return &t.Time
	}
	return &time.Time{}
}

func eventTypeFromEnumToBasic(eventType repoModel.EventType) domain.EventType {
	switch eventType {
	case repoModel.EventTypeOffline:
		return domain.EventTypeOffline
	case repoModel.EventTypeOnline:
		return domain.EventTypeOnline
	}
	return 0
}
func eventAddressFromRepoToDomain(eventAddress *repoModel.EventAddress) *domain.EventAddress {
	if eventAddress == nil {
		return nil
	}
	if !eventAddress.Country.Valid {
		return nil
	}
	return &domain.EventAddress{
		VenueName:   toStringFromNullString(eventAddress.VenueName),
		FullAddress: eventAddress.FullAddress.String,
		Country:     eventAddress.Country.String,
		City:        eventAddress.City.String,
		District:    toStringFromNullString(eventAddress.District),
		PostalCode:  toStringFromNullString(eventAddress.PostalCode),
		Latitude:    toFloat64FromNullFloat64(eventAddress.Latitude),
		Longitude:   toFloat64FromNullFloat64(eventAddress.Longitude),
	}
}

func toStringFromNullString(s sql.NullString) *string {
	if s.Valid {
		return &s.String
	}
	return nil
}

func toInt32FromNullInt32(num sql.NullInt32) *int32 {
	if num.Valid {
		return &num.Int32
	}
	return nil
}

func toFloat64FromNullFloat64(num sql.NullFloat64) *float64 {
	if num.Valid {
		return &num.Float64
	}
	return nil
}

func EventToDomainFromRepo(event *repoModel.Event) *domain.Event {
	return &domain.Event{
		Id:          event.Id,
		Title:       event.Title,
		Description: toStringFromNullString(event.Description),
		Link:        event.Link,

		Rating: func() *float32 {
			if event.Rating.Valid {
				f := float32(event.Rating.Float64)
				return &f
			}
			return nil
		}(),
		ReviewsCount:   toInt32FromNullInt32(event.ReviewsCount),
		MinAge:         toInt32FromNullInt32(event.MinAge),
		SeatsAvailable: toInt32FromNullInt32(event.SeatsAvailable),
		MinPrice:       toInt32FromNullInt32(event.MinPrice),
		Address:        eventAddressFromRepoToDomain(event.Address),
		Currency:       toStringFromNullString(event.Currency),

		Type:      eventTypeFromEnumToBasic(event.Type),
		StartsAt:  event.StartsAt,
		ImageUrl:  toStringFromNullString(event.ImageUrl),
		CreatedAt: event.CreatedAt,
		UpdatedAt: timeToBasic(event.UpdatedAt),
	}
}

func EventsFromRepoToDomain(events []*repoModel.Event) []*domain.Event {
	domainEvents := make([]*domain.Event, len(events))
	for i, event := range events {
		domainEvents[i] = EventToDomainFromRepo(event)
	}
	return domainEvents
}

func EventCategoriesFromRepoToDomain(cats []*repoModel.EventCategory) []*domain.EventCategory {
	newCats := make([]*domain.EventCategory, 0, len(cats))
	for _, cat := range cats {
		if cat != nil {
			newCats = append(newCats, &domain.EventCategory{
				Title: cat.Title,
				Code:  cat.Code,
			})
		}

	}
	return newCats
}

func FiltersFromRepoToDomain(filters *repoModel.FiltersData) *domain.FiltersData {
	return &domain.FiltersData{
		MinPrice:   toInt32FromNullInt32(filters.MinPrice),
		MaxPrice:   toInt32FromNullInt32(filters.MaxPrice),
		Cities:     filters.Cities,
		Categories: EventCategoriesFromRepoToDomain(filters.Categories),
	}
}
