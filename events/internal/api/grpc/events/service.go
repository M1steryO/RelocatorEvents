package events

import (
	"events/internal/service"
	desc "events/pkg/events_v1"
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
