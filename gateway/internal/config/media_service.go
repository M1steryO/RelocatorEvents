package config

import (
	"errors"
	"fmt"
	"os"
)

const (
	mediaServiceGRPCHostEnvName = "MEDIA_SERVICE_GRPC_HOST"
	mediaServiceGRPCPortEnvName = "MEDIA_SERVICE_GRPC_PORT"
)

type MediaServiceConfig interface {
	GetAddress() string
}

type mediaServiceConfig struct {
	host string
	port string
}

func NewMediaServiceConfig() (MediaServiceConfig, error) {
	host := os.Getenv(mediaServiceGRPCHostEnvName)
	if len(host) == 0 {
		return nil, errors.New(mediaServiceGRPCHostEnvName + " is not set")
	}

	port := os.Getenv(mediaServiceGRPCPortEnvName)
	if len(port) == 0 {
		return nil, errors.New(mediaServiceGRPCPortEnvName + " is not set")
	}

	return &mediaServiceConfig{
		host: host,
		port: port,
	}, nil
}

func (c *mediaServiceConfig) GetAddress() string {
	return fmt.Sprintf("%s:%s", c.host, c.port)
}
