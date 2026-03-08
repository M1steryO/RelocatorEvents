package events

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
)

func getEventsIds(events []*domain.Event) []int64 {
	ids := make([]int64, len(events))
	for i, event := range events {
		ids[i] = event.Id
	}
	return ids
}

func markFavourite(events []*domain.Event, favouriteMap map[int64]bool) {
	for _, event := range events {
		event.IsFavourite = favouriteMap[event.Id]
	}
}

func (s *serv) GetList(ctx context.Context, userId int64, params *domain.SearchParams) (*domain.EventsList, error) {
	var (
		events      []*domain.Event
		filtersData *domain.FiltersData
		err         error
	)

	//userCountry, err := s.userClient.GetUserCountry(ctx, userId) //if err != nil { // return nil, err //}

	userCountry := "Грузия"

	err = s.txManager.ReadCommitted(ctx, func(ctx context.Context) error {
		events, err = s.db.GetList(ctx, params, userCountry)
		if err != nil {
			return err
		}

		filtersData, err = s.db.GetFiltersData(ctx, userCountry)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	favsEvents, err := s.favsRepo.CheckList(ctx, getEventsIds(events), userId)
	if err != nil {
		return nil, err
	}

	markFavourite(events, favsEvents)

	return &domain.EventsList{
		Data:    events,
		Filters: filtersData,
	}, nil
}
