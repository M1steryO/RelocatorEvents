package events

import (
	"context"
	converter "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/events"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/api/proto/events/v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
)

func (impl *EventsImplementation) ListEvents(ctx context.Context, req *desc.ListEventsRequest) (*desc.ListEventsResponse, error) {
	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, sys.NewCommonError("missing userId", codes.InvalidArgument)
	}

	list, err := impl.service.GetList(ctx, userId, converter.SearchParamsToDomainFromApi(req))
	if err != nil {
		logger.Error("error getting events list", "err", err.Error())
		return nil, sys.NewCommonError("error getting events list", codes.Internal)
	}

	return &desc.ListEventsResponse{
		Data:    converter.EventListToApiFromService(list.Data),
		Filters: converter.FiltersToApiFromService(list.Filters),
	}, nil
}
