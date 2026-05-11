package events

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	"github.com/M1steryO/platform_common/pkg/db"
)

type txManagerFake struct {
	calls int
	err   error
}

func (m *txManagerFake) ReadCommitted(ctx context.Context, f db.Handler) error {
	m.calls++
	if m.err != nil {
		return m.err
	}
	return f(ctx)
}

type eventRepositoryFake struct {
	getListParams  *events.SearchParams
	getListCountry string
	getListResult  []*events.Event
	getListErr     error

	filtersCountry string
	filtersResult  *events.FiltersData
	filtersErr     error
}

func (r *eventRepositoryFake) Get(context.Context, int64) (*events.Event, error) {
	panic("unexpected call")
}

func (r *eventRepositoryFake) Create(context.Context, *events.Event, int64) (int64, error) {
	panic("unexpected call")
}

func (r *eventRepositoryFake) GetList(_ context.Context, params *events.SearchParams, country string) ([]*events.Event, error) {
	r.getListParams = params
	r.getListCountry = country
	return r.getListResult, r.getListErr
}

func (r *eventRepositoryFake) GetFiltersData(_ context.Context, userCountry string) (*events.FiltersData, error) {
	r.filtersCountry = userCountry
	return r.filtersResult, r.filtersErr
}

func (r *eventRepositoryFake) UpdateRating(context.Context, int64, int) error {
	panic("unexpected call")
}

func (r *eventRepositoryFake) CreateEventAddress(context.Context, *events.EventAddress) (int64, error) {
	panic("unexpected call")
}

func (r *eventRepositoryFake) CreateEventCategory(context.Context, int64, string) error {
	panic("unexpected call")
}

type favouritesRepositoryFake struct {
	checkListEventIDs []int64
	checkListUserID   int64
	checkListResult   map[int64]bool
	checkListErr      error
}

func (r *favouritesRepositoryFake) Create(context.Context, int64, int64) error {
	panic("unexpected call")
}

func (r *favouritesRepositoryFake) List(context.Context, int64) ([]int64, error) {
	panic("unexpected call")
}

func (r *favouritesRepositoryFake) Delete(context.Context, int64, int64) error {
	panic("unexpected call")
}

func (r *favouritesRepositoryFake) Check(context.Context, int64, int64) (bool, error) {
	panic("unexpected call")
}

func (r *favouritesRepositoryFake) CheckList(_ context.Context, eventIds []int64, userId int64) (map[int64]bool, error) {
	r.checkListEventIDs = append([]int64(nil), eventIds...)
	r.checkListUserID = userId
	return r.checkListResult, r.checkListErr
}

type userClientFake struct{}

func (c *userClientFake) GetUserCountry(context.Context, int64) (string, error) {
	panic("unexpected call")
}

func (c *userClientFake) GetUserName(context.Context, int64) (string, error) {
	panic("unexpected call")
}

func TestGetListMarksFavouriteEvents(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	params := &events.SearchParams{}
	eventList := []*events.Event{{Id: 10}, {Id: 20}, {Id: 30}}
	filters := &events.FiltersData{Cities: []string{"Tbilisi"}}
	eventRepo := &eventRepositoryFake{
		getListResult: eventList,
		filtersResult: filters,
	}
	favouritesRepo := &favouritesRepositoryFake{
		checkListResult: map[int64]bool{
			10: true,
			30: true,
		},
	}
	txManager := &txManagerFake{}
	svc := NewEventService(eventRepo, txManager, &userClientFake{}, favouritesRepo)

	result, err := svc.GetList(ctx, 777, params)
	if err != nil {
		t.Fatalf("GetList() error = %v", err)
	}

	if txManager.calls != 1 {
		t.Fatalf("ReadCommitted() calls = %d, want 1", txManager.calls)
	}
	if eventRepo.getListParams != params {
		t.Fatalf("GetList() params pointer was not passed through")
	}
	if eventRepo.getListCountry != "Грузия" || eventRepo.filtersCountry != "Грузия" {
		t.Fatalf("country = %q/%q, want Грузия", eventRepo.getListCountry, eventRepo.filtersCountry)
	}
	if !reflect.DeepEqual(favouritesRepo.checkListEventIDs, []int64{10, 20, 30}) {
		t.Fatalf("CheckList() ids = %v, want [10 20 30]", favouritesRepo.checkListEventIDs)
	}
	if favouritesRepo.checkListUserID != 777 {
		t.Fatalf("CheckList() userId = %d, want 777", favouritesRepo.checkListUserID)
	}
	if result.Filters != filters {
		t.Fatalf("Filters pointer was not passed through")
	}

	wantFavourite := map[int64]bool{10: true, 20: false, 30: true}
	for _, event := range result.Data {
		if event.IsFavourite != wantFavourite[event.Id] {
			t.Fatalf("event %d IsFavourite = %v, want %v", event.Id, event.IsFavourite, wantFavourite[event.Id])
		}
	}
}

func TestGetListReturnsTransactionError(t *testing.T) {
	t.Parallel()

	expectedErr := errors.New("transaction failed")
	favouritesRepo := &favouritesRepositoryFake{}
	svc := NewEventService(&eventRepositoryFake{}, &txManagerFake{err: expectedErr}, &userClientFake{}, favouritesRepo)

	result, err := svc.GetList(context.Background(), 777, &events.SearchParams{})
	if !errors.Is(err, expectedErr) {
		t.Fatalf("GetList() error = %v, want %v", err, expectedErr)
	}
	if result != nil {
		t.Fatalf("GetList() result = %#v, want nil", result)
	}
	if favouritesRepo.checkListEventIDs != nil {
		t.Fatalf("CheckList() was called after transaction error")
	}
}
