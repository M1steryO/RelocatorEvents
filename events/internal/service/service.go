package service

import (
	"context"
	domainEvents "github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	domainReviews "github.com/M1steryO/RelocatorEvents/events/internal/models/reviews"
	"github.com/M1steryO/RelocatorEvents/events/internal/usecases/reviews"
)

type EventService interface {
	Get(ctx context.Context, eventId, userId int64) (*domainEvents.Event, error)
	Create(ctx context.Context, event *domainEvents.Event, category string) (int64, error)
	GetList(ctx context.Context, userId int64, params *domainEvents.SearchParams) (*domainEvents.EventsList, error)

	CreateFavourites(ctx context.Context, eventId, userId int64) error
	FavouritesList(ctx context.Context, userId int64) ([]*domainEvents.Event, error)
	DeleteFavourites(ctx context.Context, eventId, userId int64) error
	CheckFavourites(ctx context.Context, eventId, userId int64) (bool, error)
	CheckFavouritesList(ctx context.Context, eventIds []int64, userId int64) (map[int64]bool, error)
}

type ReviewService interface {
	Create(ctx context.Context, eventId, authorId int64, review *domainReviews.Review) (int64, error)
	List(ctx context.Context, eventId int64) (*reviews.ListReviewsResult, error)
}
