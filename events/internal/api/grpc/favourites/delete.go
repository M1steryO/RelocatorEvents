package favourites

import (
	"context"
	"errors"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/favourites_v1"
)

func (impl *FavouritesImplementation) DeleteFavourites(ctx context.Context, req *desc.DeleteFavouritesRequest) (*desc.DeleteFavouritesResponse, error) {

	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, errors.New("missing userId")
	}
	err := impl.service.Delete(ctx, req.GetEventId(), userId)

	if err != nil {
		return nil, err
	}

	return &desc.DeleteFavouritesResponse{}, nil
}
