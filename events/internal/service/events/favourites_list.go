package events

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
)

func (s *serv) FavouritesList(ctx context.Context, userId int64) ([]*domain.Event, error) {
	list, err := s.favsRepo.List(ctx, userId)

	eventsList := make([]*domain.Event, 0, len(list))
	if err != nil {
		return nil, err
	}
	for _, id := range list {
		ev, err := s.Get(ctx, id, userId)
		if err != nil {
			return nil, err
		}
		eventsList = append(eventsList, ev)
	}

	return eventsList, nil
}
