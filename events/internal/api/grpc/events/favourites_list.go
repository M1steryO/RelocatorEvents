package events

import (
	"context"
	"errors"
	converter "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/events"

	desc "github.com/M1steryO/RelocatorEvents/events/pkg/events_v1"
)

func (impl *EventsImplementation) ListFavourites(ctx context.Context, req *desc.ListFavouritesRequest) (*desc.ListFavouritesResponse, error) {
	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, errors.New("missing userId")
	}
	events, err := impl.service.FavouritesList(ctx, userId)

	if err != nil {
		return nil, err
	}

	return &desc.ListFavouritesResponse{
		Events: converter.EventListToApiFromService(events),
	}, nil
}
