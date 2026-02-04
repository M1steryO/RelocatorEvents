package reviews

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/reviews"
	"log/slog"
)

func (s *serv) Create(ctx context.Context, eventId, authorId int64, review *domain.Review) (int64, error) {
	var reviewID int64

	err := s.txManager.ReadCommitted(ctx, func(txCtx context.Context) error {
		id, err := s.reviewsRepo.Create(txCtx, eventId, authorId, review)
		if err != nil {
			return err
		}

		if err := s.reviewsRepo.CreateMedia(txCtx, id, review.Media); err != nil {
			return err
		}

		if err := s.eventsRepo.UpdateRating(txCtx, eventId, review.Grade); err != nil {
			return err
		}

		reviewID = id
		return nil
	})

	if err != nil {
		if errors.Is(err, domain.ErrReviewExists) {
			logger.Warn(
				"review already exists",
				slog.Int64("event_id", eventId),
				slog.Int64("author_id", authorId),
			)
			return 0, err
		}

		logger.Error(
			"failed to create review",
			slog.Int64("event_id", eventId),
			slog.Int64("author_id", authorId),
			slog.Any("err", err.Error()),
		)
		return 0, err
	}

	logger.Info(
		"review created",
		slog.Int64("review_id", reviewID),
		slog.Int64("event_id", eventId),
		slog.Int64("author_id", authorId),
	)

	return reviewID, nil
}
