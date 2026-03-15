package events

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/models/events"
)

func (s *serv) Get(ctx context.Context, eventId, userId int64) (*domain.Event, error) {
	event, err := s.db.Get(ctx, eventId)
	if err != nil {

		return nil, err
	}

	isFavourite, err := s.favsRepo.Check(ctx, eventId, userId)
	if err != nil {
		return nil, err
	}
	event.IsFavourite = isFavourite

	return event, nil
}
