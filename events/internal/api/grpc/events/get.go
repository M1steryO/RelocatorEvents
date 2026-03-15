package events

import (
	"context"
	"errors"
	converter "github.com/M1steryO/RelocatorEvents/events/internal/api/grpc/converters/events"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	domain "github.com/M1steryO/RelocatorEvents/events/internal/models/events"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/api/proto/events/v1"
	"github.com/M1steryO/platform_common/pkg/sys"
	"github.com/M1steryO/platform_common/pkg/sys/codes"
	"log/slog"
)

func (impl *EventsImplementation) GetEvent(ctx context.Context, req *desc.GetRequest) (*desc.GetResponse, error) {
	if req.Id == 0 {
		return nil, sys.NewCommonError("invalid id", codes.InvalidArgument)
	}

	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, sys.NewCommonError("missing userId", codes.InvalidArgument)
	}

	event, err := impl.service.Get(ctx, req.GetId(), userId)
	if err != nil {

		if errors.Is(err, domain.ErrEventNotFound) {
			logger.Error("event not found", slog.Int64("eventId:", req.Id))
			return nil, sys.NewCommonError(domain.ErrEventNotFound.Error(), codes.NotFound)
		}

		return nil, sys.NewCommonError("error getting event by id", codes.Internal)
	}

	return &desc.GetResponse{
		Event: converter.EventToApiFromService(event),
	}, nil
}
