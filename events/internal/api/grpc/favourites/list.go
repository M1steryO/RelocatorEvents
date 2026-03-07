package favourites

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/favourites"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/favourites_v1"
)

func (impl *FavouritesImplementation) ListFavourites(ctx context.Context, req *desc.ListFavouritesRequest) (*desc.ListFavouritesResponse, error) {
	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, errors.New("missing userId")
	}
	events, err := impl.service.List(ctx, userId)

	if err != nil {
		return nil, err
	}

	return &desc.ListFavouritesResponse{
		Events: favourites.EventListToApiFromService(events),
	}, nil
}
