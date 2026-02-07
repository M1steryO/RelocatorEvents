package reviews

import (
	"context"
	converters "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/reviews"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/reviews_v1"
)

func (impl *ReviewsImplementation) ListReviews(ctx context.Context, req *desc.ListReviewsRequest) (*desc.ListReviewsResponse, error) {
	list, err := impl.service.List(ctx, req.GetEventId())
	if err != nil {
		return nil, err
	}
	return &desc.ListReviewsResponse{
		Rating:       list.EventRating,
		ReviewsCount: list.ReviewsCount,
		Reviews:      converters.ReviewsToProto(list.Reviews),
	}, nil
}
