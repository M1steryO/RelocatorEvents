package reviews

import domainReviews "github.com/M1steryO/RelocatorEvents/events/internal/domain/reviews"

type ListReviewsResult struct {
	Reviews      []*domainReviews.Review
	EventRating  float32
	ReviewsCount int32
}
