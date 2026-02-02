package reviews

import (
	"context"
	converters "events/internal/api/grpc/converters/reviews"
	desc "events/pkg/reviews_v1"
)

func (impl *ReviewsImplementation) ListReviews(ctx context.Context, req *desc.ListReviewsRequest) (*desc.ListReviewsResponse, error) {
	list, err := impl.service.List(ctx, req.GetEventId())
	if err != nil {
		return nil, err
	}
	return &desc.ListReviewsResponse{
		Reviews: converters.ReviewsToProto(list),
	}, nil
}
