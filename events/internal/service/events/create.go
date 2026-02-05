package events

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
)

func (s *serv) Create(ctx context.Context, event *domain.Event, category string) (int64, error) {
	var eventId int64
	err := s.txManager.ReadCommitted(ctx, func(ctx context.Context) error {
		addressId, err := s.db.CreateEventAddress(ctx, event.Address)

		if err != nil {
			return err
		}

		eventId, err = s.db.Create(ctx, event, addressId)
		if err != nil {
			return err
		}

		err = s.db.CreateEventCategory(ctx, eventId, category)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return 0, err
	}

	return eventId, nil
}
