package reviews

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/service"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/api/proto/reviews/v1"
)

type ReviewsImplementation struct {
	desc.UnimplementedReviewsServiceServer
	service service.ReviewService
}

func NewReviewsImplementation(s service.ReviewService) *ReviewsImplementation {
	return &ReviewsImplementation{
		service: s,
	}
}
