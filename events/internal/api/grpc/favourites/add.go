package favourites

import (
	"context"
	"errors"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/favourites_v1"
)

func (impl *FavouritesImplementation) AddFavourites(ctx context.Context, req *desc.AddFavouritesRequest) (*desc.AddFavouritesResponse, error) {

	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, errors.New("missing userId")
	}
	err := impl.service.Create(ctx, req.GetEventId(), userId)

	if err != nil {
		return nil, err
	}

	return &desc.AddFavouritesResponse{}, nil
}
