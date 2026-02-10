package config

import (
	"errors"
	"fmt"
	"os"
)

const (
	eventsServiceGRPCHostEnvName = "EVENTS_SERVICE_GRPC_HOST"
	eventsServiceGRPCPortEnvName = "EVENTS_SERVICE_GRPC_PORT"
)

type EventsServiceConfig interface {
	GetAddress() string
}

type eventsServiceConfig struct {
	host string
	port string
}

func NewEventsServiceConfig() (*eventsServiceConfig, error) {
	host := os.Getenv(eventsServiceGRPCHostEnvName)
	if len(host) == 0 {
		return nil, errors.New(eventsServiceGRPCHostEnvName + " is not set")
	}

	port := os.Getenv(eventsServiceGRPCPortEnvName)
	if len(port) == 0 {
		return nil, errors.New(eventsServiceGRPCPortEnvName + " is not set")
	}

	return &eventsServiceConfig{
		host: host,
		port: port,
	}, nil
}

func (c *eventsServiceConfig) GetAddress() string {
	return fmt.Sprintf("%s:%s", c.host, c.port)
}
