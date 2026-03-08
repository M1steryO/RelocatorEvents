package events

import (
	grpcClients "github.com/M1steryO/RelocatorEvents/events/internal/client/grpc"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository"
	"github.com/M1steryO/RelocatorEvents/events/internal/service"
	"github.com/M1steryO/platform_common/pkg/db"
)

type serv struct {
	db repository.EventRepository

	favsRepo repository.FavouritesRepository

	txManager  db.TxManager
	userClient grpcClients.UserServiceClient
}

func NewEventService(repo repository.EventRepository, txManager db.TxManager, userClient grpcClients.UserServiceClient, favsRepo repository.FavouritesRepository) service.EventService {
	return &serv{
		db:         repo,
		txManager:  txManager,
		userClient: userClient,
		favsRepo:   favsRepo,
	}
}
