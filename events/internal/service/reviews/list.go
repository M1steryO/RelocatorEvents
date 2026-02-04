package reviews

import (
	"context"
	domainReviews "github.com/M1steryO/RelocatorEvents/events/internal/domain/reviews"
)

func (s *serv) List(ctx context.Context, eventId int64) ([]*domainReviews.Review, error) {
	list, err := s.reviewsRepo.List(ctx, eventId)
	if err != nil {
		return nil, err
	}
	return list, nil
}
