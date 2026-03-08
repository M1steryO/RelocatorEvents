package events

import (
	"context"
	"errors"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/events_v1"
)

func (impl *EventsImplementation) AddFavourites(ctx context.Context, req *desc.AddFavouritesRequest) (*desc.AddFavouritesResponse, error) {

	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, errors.New("missing userId")
	}
	err := impl.service.CreateFavourites(ctx, req.GetEventId(), userId)

	if err != nil {
		return nil, err
	}

	return &desc.AddFavouritesResponse{}, nil
}
