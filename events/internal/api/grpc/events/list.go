package events

import (
	"context"
	converter "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/events"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/events_v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"log/slog"
)

func (i *EventsImplementation) ListEvents(ctx context.Context, req *desc.ListEventsRequest) (*desc.ListEventsResponse, error) {
	list, err := i.service.GetList(ctx, converter.SearchParamsToDomainFromApi(req))
	if err != nil {
		logger.Error("error getting events list", slog.String("err", err.Error()))
		return nil, sys.NewCommonError("error getting events list", codes.Internal)
	}

	return &desc.ListEventsResponse{
		Data:    converter.EventListToApiFromService(list.Data),
		Filters: converter.FiltersToApiFromService(list.Filters),
	}, nil
}
