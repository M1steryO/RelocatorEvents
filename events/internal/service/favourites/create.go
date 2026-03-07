package favourites

import (
	"context"
)

func (s *serv) Create(ctx context.Context, eventId, userId int64) error {
	_, err := s.eventsService.Get(ctx, eventId)
	if err != nil {
		return err
	}

	err = s.db.Create(ctx, eventId, userId)
	if err != nil {
		return err
	}

	return nil
}
