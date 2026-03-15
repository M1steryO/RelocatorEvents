package events

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/service"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/api/proto/events/v1"
)

type EventsImplementation struct {
	desc.UnimplementedEventServiceServer
	service service.EventService
}

func NewEventsImplementation(s service.EventService) *EventsImplementation {
	return &EventsImplementation{
		service: s,
	}
}
