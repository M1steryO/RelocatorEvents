package reviews

import (
	"context"
	converter "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/reviews"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/reviews_v1"
)

func (impl *ReviewsImplementation) CreateReview(ctx context.Context, req *desc.CreateReviewRequest) (*desc.CreateReviewResponse, error) {
	review, err := converter.ReviewFromProto(req.GetReview())
	if err != nil {
		return nil, err
	}
	//userId, ok := ctx.Value("userId").(int64)
	//if !ok {
	//	return nil, errors.New("missing userId")
	//}

	_, err = impl.service.Create(ctx, req.EventId, review.AuthorId, review)
	if err != nil {
		return nil, err
	}

	return &desc.CreateReviewResponse{}, nil
}
