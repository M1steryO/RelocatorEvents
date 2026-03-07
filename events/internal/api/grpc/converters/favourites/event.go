package favourites

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/common"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/favourites_v1"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

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
		MinAge:   common.ToInt32ValueFromInt32(event.MinAge),
		MinPrice: common.ToInt32ValueFromInt32(event.MinPrice),
		Currency: common.ToStringValueFromString(event.Currency),

		StartsAt:  common.TimeToProto(&event.StartsAt),
		ImageUrl:  common.ToStringValueFromString(event.ImageUrl),
		CreatedAt: common.TimeToProto(&event.CreatedAt),
	}
}

func EventListToApiFromService(events []*domain.Event) []*desc.Event {
	result := make([]*desc.Event, len(events))
	for i, e := range events {
		result[i] = EventToApiFromService(e)
	}
	return result
}
