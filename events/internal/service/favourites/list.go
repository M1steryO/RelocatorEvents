package favourites

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
)

func (s *serv) List(ctx context.Context, userId int64) ([]*domain.Event, error) {
	list, err := s.db.List(ctx, userId)

	eventsList := make([]*domain.Event, 0, len(list))
	if err != nil {
		return nil, err
	}
	for _, id := range list {
		ev, err := s.eventsService.Get(ctx, id)
		if err != nil {
			return nil, err
		}
		eventsList = append(eventsList, ev)
	}

	return eventsList, nil
}
