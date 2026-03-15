package reviews

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/models/reviews"
)

func (s *serv) Create(ctx context.Context, eventId, authorId int64, review *domain.Review) (int64, error) {
	var reviewID int64
	authorName, err := s.userClient.GetUserName(ctx, authorId)
	if err != nil {
		return 0, err
	}
	review.AuthorId = authorId
	review.AuthorName = &authorName

	err = s.txManager.ReadCommitted(ctx, func(txCtx context.Context) error {
		if len(review.Text) != 0 || len(review.Disadvantages) != 0 || len(review.Advantages) != 0 {
			id, err := s.reviewsRepo.Create(txCtx, eventId, review)
			if err != nil {
				return err
			}

			if err := s.reviewsRepo.CreateMedia(txCtx, id, review.Media); err != nil {
				return err
			}
			reviewID = id
		}
		if err := s.eventsRepo.UpdateRating(txCtx, eventId, review.Grade); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return 0, err
	}

	return reviewID, nil
}
