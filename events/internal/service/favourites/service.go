package favourites

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/repository"
	"github.com/M1steryO/RelocatorEvents/events/internal/service"
	"github.com/M1steryO/platform_common/pkg/db"
)

type serv struct {
	db            repository.FavouritesRepository
	txManager     db.TxManager
	eventsService service.EventService
}

func NewFavouritesService(repo repository.FavouritesRepository, txManager db.TxManager, eventsService service.EventService) service.FavouritesService {
	return &serv{
		db:            repo,
		txManager:     txManager,
		eventsService: eventsService,
	}
}
