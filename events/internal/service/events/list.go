package events

import (
	"context"
	"errors"
	domain "events/internal/domain/events"
)

func (s *serv) GetList(ctx context.Context, params *domain.SearchParams) (*domain.EventsList, error) {
	var (
		events      []*domain.Event
		filtersData *domain.FiltersData
		err         error
	)
	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, errors.New("userId not found in context")
	}

	userCountry, err := s.userClient.GetUserCountry(ctx, userId)
	if err != nil {
		return nil, err
	}

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
	return &domain.EventsList{
		Data:    events,
		Filters: filtersData,
	}, nil
}
