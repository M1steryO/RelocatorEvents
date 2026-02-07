package reviews

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/events/internal/usecases/reviews"
)

func (s *serv) List(ctx context.Context, eventId int64) (*reviews.ListReviewsResult, error) {
	var (
		res reviews.ListReviewsResult
		err error
	)

	err = s.txManager.ReadCommitted(ctx, func(ctx context.Context) error {
		res.Reviews, err = s.reviewsRepo.List(ctx, eventId)
		if err != nil {
			return err
		}

		event, err := s.eventsRepo.Get(ctx, eventId)
		if err != nil {
			return err
		}
		if event.Rating != nil {
			res.EventRating = *event.Rating
		}

		if event.ReviewsCount != nil {
			res.ReviewsCount = *event.ReviewsCount
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &res, nil
}
