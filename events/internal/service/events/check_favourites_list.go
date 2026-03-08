package events

import (
	"context"
)

func (s *serv) CheckFavouritesList(ctx context.Context, eventIds []int64, userId int64) (map[int64]bool, error) {
	data, err := s.favsRepo.CheckList(ctx, eventIds, userId)
	if err != nil {
		return nil, err
	}

	return data, nil
}
