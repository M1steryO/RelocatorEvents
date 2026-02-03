package config

import (
	"errors"
	"fmt"
	"os"
)

const (
	authServiceGRPCHostEnvName = "AUTH_SERVICE_GRPC_HOST"
	authServiceGRPCPortEnvName = "AUTH_SERVICE_GRPC_PORT"
)

type AuthServiceConfig interface {
	GetAddress() string
}

type authServiceConfig struct {
	host string
	port string
}

func NewAuthServiceConfig() (AuthServiceConfig, error) {
	host := os.Getenv(authServiceGRPCHostEnvName)
	if len(host) == 0 {
		return nil, errors.New(authServiceGRPCHostEnvName + " is not set")
	}

	port := os.Getenv(authServiceGRPCPortEnvName)
	if len(port) == 0 {
		return nil, errors.New(authServiceGRPCPortEnvName + " is not set")
	}

	return &authServiceConfig{
		host: host,
		port: port,
	}, nil
}

func (c *authServiceConfig) GetAddress() string {
	return fmt.Sprintf("%s:%s", c.host, c.port)
}
