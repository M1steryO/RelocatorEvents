package events

import (
	"context"
)

func (s *serv) DeleteFavourites(ctx context.Context, eventId, userId int64) error {

	err := s.favsRepo.Delete(ctx, eventId, userId)

	if err != nil {
		return err
	}
	return nil
}
