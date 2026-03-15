package events

import (
	"context"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/api/proto/events/v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
)

func (impl *EventsImplementation) AddFavourites(ctx context.Context, req *desc.AddFavouritesRequest) (*desc.AddFavouritesResponse, error) {

	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, sys.NewCommonError("missing userId", codes.InvalidArgument)
	}
	err := impl.service.CreateFavourites(ctx, req.GetEventId(), userId)

	if err != nil {
		return nil, err
	}

	return &desc.AddFavouritesResponse{}, nil
}
