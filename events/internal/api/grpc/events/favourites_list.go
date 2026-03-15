package events

import (
	"context"
	converter "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/events"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"

	desc "github.com/M1steryO/RelocatorEvents/events/pkg/api/proto/events/v1"
)

func (impl *EventsImplementation) ListFavourites(ctx context.Context, req *desc.ListFavouritesRequest) (*desc.ListFavouritesResponse, error) {
	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, sys.NewCommonError("missing userId", codes.InvalidArgument)
	}
	events, err := impl.service.FavouritesList(ctx, userId)

	if err != nil {
		return nil, err
	}

	return &desc.ListFavouritesResponse{
		Events: converter.EventListToApiFromService(events),
	}, nil
}
