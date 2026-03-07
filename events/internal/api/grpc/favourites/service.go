package favourites

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/service"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/favourites_v1"
)

type FavouritesImplementation struct {
	desc.UnimplementedFavouritesServiceServer
	service service.FavouritesService
}

func NewFavouritesImplementation(s service.FavouritesService) *FavouritesImplementation {
	return &FavouritesImplementation{
		service: s,
	}
}
