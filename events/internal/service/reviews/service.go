package reviews

import (
	grpcClients "github.com/M1steryO/RelocatorEvents/events/internal/client/grpc"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository"
	"github.com/M1steryO/platform_common/pkg/db"
)

type serv struct {
	reviewsRepo repository.ReviewRepository
	eventsRepo  repository.EventRepository
	txManager   db.TxManager

	userClient grpcClients.UserServiceClient
}

func NewReviewService(reviewsRepo repository.ReviewRepository, eventsRepo repository.EventRepository, tx db.TxManager, uClient grpcClients.UserServiceClient) *serv {
	return &serv{
		reviewsRepo: reviewsRepo,
		eventsRepo:  eventsRepo,
		txManager:   tx,
		userClient:  uClient,
	}
}
