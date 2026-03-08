package events

import (
	"context"
)

func (s *serv) CreateFavourites(ctx context.Context, eventId, userId int64) error {
	_, err := s.Get(ctx, eventId, userId)
	if err != nil {
		return err
	}

	err = s.favsRepo.Create(ctx, eventId, userId)
	if err != nil {
		return err
	}

	return nil
}
