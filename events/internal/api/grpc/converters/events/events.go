package events

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/common"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/events_v1"
	"google.golang.org/protobuf/types/known/wrapperspb"
	"time"
)

func EventAddressToApiFromService(address *domain.EventAddress) *desc.EventAddress {
	if address == nil {
		return nil
	}
	return &desc.EventAddress{
		VenueName:   common.ToStringValueFromString(address.VenueName),
		FullAddress: address.FullAddress,
		City:        address.City,
		District:    common.ToStringValueFromString(address.District),

		Country:    address.Country,
		PostalCode: common.ToStringValueFromString(address.PostalCode),
		Latitude:   common.ToFloatValueFromFloat64(address.Latitude),
		Longitude:  common.ToFloatValueFromFloat64(address.Longitude),
	}
}

func EventToApiFromService(event *domain.Event) *desc.Event {
	return &desc.Event{
		Id:          event.Id,
		Title:       event.Title,
		Description: common.ToStringValueFromString(event.Description),
		Link:        event.Link,

		Rating: func() *wrapperspb.FloatValue {
			if event.Rating != nil {
				return wrapperspb.Float(*event.Rating)
			}
			return nil
		}(),
		ReviewsCount:   common.ToInt32ValueFromInt32(event.ReviewsCount),
		MinAge:         common.ToInt32ValueFromInt32(event.MinAge),
		SeatsAvailable: common.ToInt32ValueFromInt32(event.SeatsAvailable),
		MinPrice:       common.ToInt32ValueFromInt32(event.MinPrice),
		Currency:       common.ToStringValueFromString(event.Currency),

		Address: EventAddressToApiFromService(event.Address),

		EventType: desc.EVENT_TYPE(event.Type),
		StartsAt:  common.TimeToProto(&event.StartsAt),
		ImageUrl:  common.ToStringValueFromString(event.ImageUrl),
		CreatedAt: common.TimeToProto(&event.CreatedAt),
		UpdatedAt: common.TimeToProto(event.UpdatedAt),
	}
}

func SearchParamsToDomainFromApi(params *desc.ListEventsRequest) *domain.SearchParams {
	return &domain.SearchParams{
		Q:        common.ToStringFromStringValue(params.Q),
		Sort:     common.ToStringFromStringValue(params.Sort),
		City:     common.ToStringFromStringValue(params.City),
		District: common.ToStringFromStringValue(params.District),

		MinPrice: common.ToInt32FromInt32Value(params.MinPrice),
		MaxPrice: common.ToInt32FromInt32Value(params.MaxPrice),

		EventDate: func() *domain.EventDate {
			if params.EventDate != nil {
				date, err := time.Parse("2006-01-02", params.EventDate.Value)
				if err != nil {
					switch params.EventDate.Value {
					case "today":
						preset := domain.PresetToday
						return &domain.EventDate{
							Preset: &preset,
						}
					case "tomorrow":
						preset := domain.PresetTomorrow
						return &domain.EventDate{
							Preset: &preset,
						}
					case "weekends":
						preset := domain.PresetWeekends
						return &domain.EventDate{
							Preset: &preset,
						}
					case "weekdays":
						preset := domain.PresetWeekdays
						return &domain.EventDate{
							Preset: &preset,
						}
					default:
						return nil
					}
				}
				return &domain.EventDate{
					Date: &date,
				}

			}
			return nil
		}(),

		EventType: func() *domain.EventType {
			if params.EventType != nil {
				e := domain.EventType(*params.EventType)
				return &e
			}
			return nil

		}(),
		Categories: params.Category,

		Limit:  common.ToInt64FromInt64Value(params.Limit),
		LastID: common.ToInt64FromInt64Value(params.LastId),
	}
}

func EventListToApiFromService(events []*domain.Event) []*desc.Event {
	result := make([]*desc.Event, len(events))
	for i, e := range events {
		result[i] = EventToApiFromService(e)
	}
	return result
}

func EventCategoriesFromDomainToApi(cats []*domain.EventCategory) []*desc.EventCategory {
	newCats := make([]*desc.EventCategory, 0, len(cats))
	for _, cat := range cats {
		if cat != nil {
			newCats = append(newCats, &desc.EventCategory{
				Title: cat.Title,
				Code:  cat.Code,
			})
		}

	}
	return newCats
}

func FiltersToApiFromService(filters *domain.FiltersData) *desc.FiltersValues {
	return &desc.FiltersValues{
		MinPrice:   common.ToInt32ValueFromInt32(filters.MinPrice),
		MaxPrice:   common.ToInt32ValueFromInt32(filters.MaxPrice),
		Cities:     filters.Cities,
		Categories: EventCategoriesFromDomainToApi(filters.Categories),
	}
}
