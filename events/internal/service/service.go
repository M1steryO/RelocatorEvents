package service

import (
	"context"
	domainEvents "events/internal/domain/events"
	domainReviews "events/internal/domain/reviews"
)

type EventService interface {
	Get(ctx context.Context, id int64) (*domainEvents.Event, error)
	Create(ctx context.Context, event *domainEvents.Event) (int64, error)
	GetList(ctx context.Context, params *domainEvents.SearchParams) (*domainEvents.EventsList, error)
}

type ReviewService interface {
	Create(ctx context.Context, eventId, authorId int64, review *domainReviews.Review) (int64, error)
	List(ctx context.Context, eventId int64) ([]*domainReviews.Review, error)
}
