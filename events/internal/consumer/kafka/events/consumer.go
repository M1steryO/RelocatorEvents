package events

import "github.com/M1steryO/RelocatorEvents/events/internal/service"

type EventsHandler struct {
	service service.EventService
}

func NewEventsHandler(service service.EventService) *EventsHandler {
	return &EventsHandler{
		service: service,
	}
}
