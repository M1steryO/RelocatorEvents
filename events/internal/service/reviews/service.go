package reviews

import (
	"events/internal/repository"
	"github.com/M1steryO/platform_common/pkg/db"
)

type serv struct {
	reviewsRepo repository.ReviewRepository
	eventsRepo  repository.EventRepository
	txManager   db.TxManager
}

func NewReviewService(reviewsRepo repository.ReviewRepository, eventsRepo repository.EventRepository, tx db.TxManager) *serv {
	return &serv{
		reviewsRepo: reviewsRepo,
		eventsRepo:  eventsRepo,
		txManager:   tx,
	}
}
