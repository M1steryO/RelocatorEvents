package events

import (
	"context"
	"encoding/json"
	"github.com/M1steryO/RelocatorEvents/events/internal/consumer/kafka/events/converters"
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

func (e *EventsHandler) Handle(ctx context.Context, msg []byte, _ kafka.TopicPartition, consumerNumber int) error {
	var event converters.Event

	err := json.Unmarshal(msg, &event)
	if err != nil {
		logger.Error("Error unmarshalling event: ", err.Error())
		return err
	}

	ev := converters.ToDomainEvent(event)

	id, err := e.service.Create(ctx, ev)
	if err != nil {
		logger.Error("Error creating event: ", err.Error())
		return err
	}
	logger.Info("Created event: ", "id", id)
	return nil
}
