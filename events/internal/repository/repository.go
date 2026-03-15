package repository

import (
	"context"
	domainEvents "github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	domainReviews "github.com/M1steryO/RelocatorEvents/events/internal/models/reviews"
)

type EventRepository interface {
	Get(ctx context.Context, id int64) (*domainEvents.Event, error)
	Create(ctx context.Context, event *domainEvents.Event, addressId int64) (int64, error)
	GetList(ctx context.Context, params *domainEvents.SearchParams, country string) ([]*domainEvents.Event, error)
	GetFiltersData(ctx context.Context, userCountry string) (*domainEvents.FiltersData, error)
	UpdateRating(ctx context.Context, eventId int64, grade int) error
	CreateEventAddress(ctx context.Context, event *domainEvents.EventAddress) (int64, error)
	CreateEventCategory(ctx context.Context, eventId int64, categoryCode string) error
}

type ReviewRepository interface {
	Create(ctx context.Context, eventId int64, review *domainReviews.Review) (int64, error)
	CreateMedia(ctx context.Context, reviewId int64, media []*domainReviews.MediaAttachment) error
	List(ctx context.Context, eventId int64) ([]*domainReviews.Review, error)
}

type FavouritesRepository interface {
	Create(ctx context.Context, eventId, userId int64) error
	List(ctx context.Context, userId int64) ([]int64, error)
	Delete(ctx context.Context, eventId, userId int64) error
	Check(ctx context.Context, eventId, userId int64) (bool, error)
	CheckList(ctx context.Context, eventIds []int64, userId int64) (map[int64]bool, error)
}
