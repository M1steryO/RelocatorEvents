package reviews

import (
	"context"
	"errors"
	converter "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/reviews"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	"github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/api/proto/reviews/v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"log/slog"
)

func (impl *ReviewsImplementation) CreateReview(ctx context.Context, req *desc.CreateReviewRequest) (*desc.CreateReviewResponse, error) {
	review, err := converter.ReviewFromProto(req.GetReview())
	if err != nil {
		return nil, err
	}

	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, sys.NewCommonError("missing userId", codes.InvalidArgument)
	}

	_, err = impl.service.Create(ctx, req.EventId, userId, review)
	if err != nil {
		if errors.Is(err, events.ErrEventNotFound) {
			logger.Warn(
				"review already exists",
				slog.Int64("event_id", req.GetEventId()),
				slog.Int64("author_id", review.AuthorId),
			)
			return nil, sys.NewCommonError("event not found", codes.AlreadyExists)
		}
		return nil, err
	}

	return &desc.CreateReviewResponse{}, nil
}
