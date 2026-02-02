package events

import (
	"events/internal/repository"
	"events/internal/service"
	"github.com/M1steryO/platform_common/pkg/db"
)

type serv struct {
	db        repository.EventRepository
	txManager db.TxManager
}

func NewEventService(repo repository.EventRepository, txManager db.TxManager) service.EventService {
	return &serv{
		db:        repo,
		txManager: txManager,
	}
}
