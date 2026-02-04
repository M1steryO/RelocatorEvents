package events

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/service"
	desc "github.com/M1steryO/RelocatorEvents/events/pkg/events_v1"
)

type EventsImplementation struct {
	desc.UnimplementedEvent_V1Server
	service service.EventService
}

func NewEventsImplementation(s service.EventService) *EventsImplementation {
	return &EventsImplementation{
		service: s,
	}
}
