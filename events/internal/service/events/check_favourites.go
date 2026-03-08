package events

import (
	"context"
)

func (s *serv) CheckFavourites(ctx context.Context, eventId, userId int64) (bool, error) {
	exists, err := s.favsRepo.Check(ctx, eventId, userId)
	if err != nil {
		return false, err
	}

	return exists, nil
}
