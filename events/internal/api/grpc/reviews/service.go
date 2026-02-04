package reviews

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/service"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/reviews_v1"
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
