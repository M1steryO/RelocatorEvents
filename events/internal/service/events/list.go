package events

import (
	"context"
	domain "events/internal/domain/events"
)

func (s *serv) GetList(ctx context.Context, params *domain.SearchParams) (*domain.EventsList, error) {
	var (
		events      []*domain.Event
		filtersData *domain.FiltersData
		err         error
	)
	userCountry := "Россия" // TODO: get user country
	err = s.txManager.ReadCommitted(ctx, func(ctx context.Context) error {
		events, err = s.db.GetList(ctx, params)
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
