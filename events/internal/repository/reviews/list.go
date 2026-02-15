package reviews

import (
	"context"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/reviews"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository/reviews/converters"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository/reviews/model"
	"github.com/M1steryO/platform_common/pkg/db"
)

func (r *repo) List(ctx context.Context, eventId int64) ([]*domain.Review, error) {
	var reviewModels []*model.Review

	q := db.Query{
		Title: "review_repository.List",
		Query: `select r.author_id, r.grade, r.advantages, r.disadvantages, r.text, r.created_at,
       		coalesce(
			  jsonb_agg(
				jsonb_build_object('key', rm.storage_key, 'type', rm.media_type)
			  ) filter (where rm.id is not null),
			  '[]'::jsonb
			) as media_files
				from reviews r
				left join reviews_media rm on r.id = rm.review_id
				where r.event_id = $1
				group by r.id`,
	}

	err := r.db.DB().ScanAllContext(ctx, &reviewModels, q, eventId)

	if err != nil {
		return nil, err
	}

	return converters.ReviewsFromRepo(reviewModels), nil
}
