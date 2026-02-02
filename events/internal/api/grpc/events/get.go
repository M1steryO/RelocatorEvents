package events

import (
	"context"
	"errors"
	converter "events/internal/api/grpc/converters/events"
	"events/internal/core/logger"
	domain "events/internal/domain/events"
	desc "events/pkg/events_v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"log/slog"
)

func (i *EventsImplementation) GetEvent(ctx context.Context, req *desc.GetRequest) (*desc.GetResponse, error) {
	if req.Id == 0 {
		return nil, sys.NewCommonError("invalid id", codes.InvalidArgument)

	}
	logger.Info("Received", slog.Int64("id:", req.GetId()))

	event, err := i.service.Get(ctx, req.GetId())
	if err != nil {
		if errors.Is(err, domain.ErrEventNotFound) {
			return nil, sys.NewCommonError(domain.ErrEventNotFound.Error(), codes.NotFound)
		}
		return nil, sys.NewCommonError("error getting event by id", codes.Internal)
	}

	return &desc.GetResponse{
		Event: converter.EventToApiFromService(event),
	}, nil
}
