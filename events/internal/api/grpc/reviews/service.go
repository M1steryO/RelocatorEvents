package reviews

import (
	"events/internal/service"
	desc "events/pkg/reviews_v1"
)

type ReviewsImplementation struct {
	desc.UnimplementedReviewsV1Server
	service service.ReviewService
}

func NewReviewsImplementation(s service.ReviewService) *ReviewsImplementation {
	return &ReviewsImplementation{
		service: s,
	}
}
