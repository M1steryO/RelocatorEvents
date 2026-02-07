package reviews

import (
	"context"
	"errors"
	converter "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/reviews"
	"github.com/M1steryO/RelocatorEvents/events/internal/domain/events"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/reviews_v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
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
		if errors.Is(err, events.ErrEventNotFound) {
			return nil, status.Error(codes.NotFound, "event not found")
		}
		return nil, err
	}

	return &desc.CreateReviewResponse{}, nil
}
