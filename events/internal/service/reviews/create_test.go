package reviews

import (
	"context"
	"errors"
	"reflect"
	"testing"

	domainEvents "github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	domainReviews "github.com/M1steryO/RelocatorEvents/events/internal/models/reviews"
	"github.com/M1steryO/platform_common/pkg/db"
)

type txManagerFake struct {
	calls int
}

func (m *txManagerFake) ReadCommitted(ctx context.Context, f db.Handler) error {
	m.calls++
	return f(ctx)
}

type reviewRepositoryFake struct {
	createEventID int64
	createReview  *domainReviews.Review
	createID      int64
	createErr     error

	createMediaReviewID int64
	createMedia         []*domainReviews.MediaAttachment
	createMediaErr      error
}

func (r *reviewRepositoryFake) Create(_ context.Context, eventId int64, review *domainReviews.Review) (int64, error) {
	r.createEventID = eventId
	r.createReview = review
	return r.createID, r.createErr
}

func (r *reviewRepositoryFake) CreateMedia(_ context.Context, reviewId int64, media []*domainReviews.MediaAttachment) error {
	r.createMediaReviewID = reviewId
	r.createMedia = media
	return r.createMediaErr
}

func (r *reviewRepositoryFake) List(context.Context, int64) ([]*domainReviews.Review, error) {
	panic("unexpected call")
}

type eventRepositoryFake struct {
	updateRatingEventID int64
	updateRatingGrade   int
	updateRatingCalls   int
	updateRatingErr     error
}

func (r *eventRepositoryFake) Get(context.Context, int64) (*domainEvents.Event, error) {
	panic("unexpected call")
}

func (r *eventRepositoryFake) Create(context.Context, *domainEvents.Event, int64) (int64, error) {
	panic("unexpected call")
}

func (r *eventRepositoryFake) GetList(context.Context, *domainEvents.SearchParams, string) ([]*domainEvents.Event, error) {
	panic("unexpected call")
}

func (r *eventRepositoryFake) GetFiltersData(context.Context, string) (*domainEvents.FiltersData, error) {
	panic("unexpected call")
}

func (r *eventRepositoryFake) UpdateRating(_ context.Context, eventId int64, grade int) error {
	r.updateRatingCalls++
	r.updateRatingEventID = eventId
	r.updateRatingGrade = grade
	return r.updateRatingErr
}

func (r *eventRepositoryFake) CreateEventAddress(context.Context, *domainEvents.EventAddress) (int64, error) {
	panic("unexpected call")
}

func (r *eventRepositoryFake) CreateEventCategory(context.Context, int64, string) error {
	panic("unexpected call")
}

type userClientFake struct {
	name  string
	err   error
	calls int
}

func (c *userClientFake) GetUserCountry(context.Context, int64) (string, error) {
	panic("unexpected call")
}

func (c *userClientFake) GetUserName(context.Context, int64) (string, error) {
	c.calls++
	return c.name, c.err
}

func TestCreatePersistsTextReviewAndUpdatesRating(t *testing.T) {
	t.Parallel()

	media := []*domainReviews.MediaAttachment{{StorageKey: "reviews/1.jpg", Type: domainReviews.MediaTypeImage}}
	review := &domainReviews.Review{
		Grade: 5,
		Text:  "Great event",
		Media: media,
	}
	reviewsRepo := &reviewRepositoryFake{createID: 555}
	eventsRepo := &eventRepositoryFake{}
	txManager := &txManagerFake{}
	userClient := &userClientFake{name: "Dmitry"}
	svc := NewReviewService(reviewsRepo, eventsRepo, txManager, userClient)

	id, err := svc.Create(context.Background(), 99, 777, review)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if id != 555 {
		t.Fatalf("Create() id = %d, want 555", id)
	}
	if userClient.calls != 1 {
		t.Fatalf("GetUserName() calls = %d, want 1", userClient.calls)
	}
	if txManager.calls != 1 {
		t.Fatalf("ReadCommitted() calls = %d, want 1", txManager.calls)
	}
	if reviewsRepo.createEventID != 99 {
		t.Fatalf("reviews Create() eventId = %d, want 99", reviewsRepo.createEventID)
	}
	if reviewsRepo.createReview != review {
		t.Fatalf("reviews Create() did not receive original review pointer")
	}
	if review.AuthorId != 777 {
		t.Fatalf("AuthorId = %d, want 777", review.AuthorId)
	}
	if review.AuthorName == nil || *review.AuthorName != "Dmitry" {
		t.Fatalf("AuthorName = %v, want Dmitry", review.AuthorName)
	}
	if reviewsRepo.createMediaReviewID != 555 {
		t.Fatalf("CreateMedia() reviewId = %d, want 555", reviewsRepo.createMediaReviewID)
	}
	if !reflect.DeepEqual(reviewsRepo.createMedia, media) {
		t.Fatalf("CreateMedia() media = %#v, want %#v", reviewsRepo.createMedia, media)
	}
	if eventsRepo.updateRatingCalls != 1 || eventsRepo.updateRatingEventID != 99 || eventsRepo.updateRatingGrade != 5 {
		t.Fatalf("UpdateRating() = calls:%d event:%d grade:%d, want calls:1 event:99 grade:5", eventsRepo.updateRatingCalls, eventsRepo.updateRatingEventID, eventsRepo.updateRatingGrade)
	}
}

func TestCreateRatingOnlyReviewUpdatesRatingWithoutPersistingReview(t *testing.T) {
	t.Parallel()

	reviewsRepo := &reviewRepositoryFake{}
	eventsRepo := &eventRepositoryFake{}
	svc := NewReviewService(reviewsRepo, eventsRepo, &txManagerFake{}, &userClientFake{name: "Dmitry"})

	id, err := svc.Create(context.Background(), 99, 777, &domainReviews.Review{Grade: 4})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if id != 0 {
		t.Fatalf("Create() id = %d, want 0", id)
	}
	if reviewsRepo.createReview != nil {
		t.Fatalf("review was persisted for rating-only request")
	}
	if reviewsRepo.createMedia != nil {
		t.Fatalf("media was persisted for rating-only request")
	}
	if eventsRepo.updateRatingCalls != 1 || eventsRepo.updateRatingGrade != 4 {
		t.Fatalf("UpdateRating() = calls:%d grade:%d, want calls:1 grade:4", eventsRepo.updateRatingCalls, eventsRepo.updateRatingGrade)
	}
}

func TestCreateReturnsUserClientErrorBeforeTransaction(t *testing.T) {
	t.Parallel()

	expectedErr := errors.New("users unavailable")
	txManager := &txManagerFake{}
	svc := NewReviewService(&reviewRepositoryFake{}, &eventRepositoryFake{}, txManager, &userClientFake{err: expectedErr})

	id, err := svc.Create(context.Background(), 99, 777, &domainReviews.Review{Grade: 5, Text: "Great"})
	if !errors.Is(err, expectedErr) {
		t.Fatalf("Create() error = %v, want %v", err, expectedErr)
	}
	if id != 0 {
		t.Fatalf("Create() id = %d, want 0", id)
	}
	if txManager.calls != 0 {
		t.Fatalf("ReadCommitted() calls = %d, want 0", txManager.calls)
	}
}
