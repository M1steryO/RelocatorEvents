package events

import (
	grpcClients "events/internal/client/grpc"
	"events/internal/repository"
	"events/internal/service"
	"github.com/M1steryO/platform_common/pkg/db"
)

type serv struct {
	db         repository.EventRepository
	txManager  db.TxManager
	userClient grpcClients.UserServiceClient
}

func NewEventService(repo repository.EventRepository, txManager db.TxManager, userClient grpcClients.UserServiceClient) service.EventService {
	return &serv{
		db:         repo,
		txManager:  txManager,
		userClient: userClient,
	}
}
