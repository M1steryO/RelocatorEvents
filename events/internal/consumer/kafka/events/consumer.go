package events

import "events/internal/service"

type EventsHandler struct {
	service service.EventService
}

func NewEventsHandler(service service.EventService) *EventsHandler {
	return &EventsHandler{
		service: service,
	}
}
