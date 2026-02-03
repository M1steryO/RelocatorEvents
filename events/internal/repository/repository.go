package repository

import (
	"context"
	domainEvents "events/internal/domain/events"
	domainReviews "events/internal/domain/reviews"
)

type EventRepository interface {
	Get(ctx context.Context, id int64) (*domainEvents.Event, error)
	Create(ctx context.Context, event *domainEvents.Event, addressId int64) (int64, error)
	GetList(ctx context.Context, params *domainEvents.SearchParams, country string) ([]*domainEvents.Event, error)
	GetFiltersData(ctx context.Context, userCountry string) (*domainEvents.FiltersData, error)
	UpdateRating(ctx context.Context, eventId int64, grade int) error
	CreateEventAddress(ctx context.Context, event *domainEvents.EventAddress) (int64, error)
}

type ReviewRepository interface {
	Create(ctx context.Context, eventId int64, authorId int64, review *domainReviews.Review) (int64, error)
	CreateMedia(ctx context.Context, reviewId int64, media []*domainReviews.MediaAttachment) error
	List(ctx context.Context, eventId int64) ([]*domainReviews.Review, error)
}
