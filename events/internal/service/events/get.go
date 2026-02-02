package events

import (
	"context"
	"events/internal/core/logger"
	domain "events/internal/domain/events"
	"log/slog"
)

func (s *serv) Get(ctx context.Context, id int64) (*domain.Event, error) {
	event, err := s.db.Get(ctx, id)
	if err != nil {
		logger.Error("error getting event", slog.String("error", err.Error()))
		return nil, err
	}
	return event, nil
}
