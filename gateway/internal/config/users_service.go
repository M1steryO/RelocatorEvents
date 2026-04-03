package config

import (
	"errors"
	"fmt"
	"os"
)

const (
	usersServiceGRPCHostEnvName = "USERS_SERVICE_GRPC_HOST"
	usersServiceGRPCPortEnvName = "USERS_SERVICE_GRPC_PORT"
)

type UsersServiceConfig interface {
	GetAddress() string
}

type usersServiceConfig struct {
	host string
	port string
}

func NewUsersServiceConfig() (UsersServiceConfig, error) {
	host := os.Getenv(usersServiceGRPCHostEnvName)
	if len(host) == 0 {
		return nil, errors.New(usersServiceGRPCHostEnvName + " is not set")
	}

	port := os.Getenv(usersServiceGRPCPortEnvName)
	if len(port) == 0 {
		return nil, errors.New(usersServiceGRPCPortEnvName + " is not set")
	}

	return &usersServiceConfig{
		host: host,
		port: port,
	}, nil
}

func (c *usersServiceConfig) GetAddress() string {
	return fmt.Sprintf("%s:%s", c.host, c.port)
}
