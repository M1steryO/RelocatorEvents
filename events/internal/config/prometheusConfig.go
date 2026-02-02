package config

import (
	"errors"
	"net"
	"os"
)

const (
	promHostEnvName = "PROM_HOST"
	promPortEnvName = "PROM_PORT"
)

type PromConfig interface {
	Address() string
}
type promConfig struct {
	host string
	port string
}

func NewPromConfig() (PromConfig, error) {
	host := os.Getenv(promHostEnvName)
	if len(host) == 0 {
		return nil, errors.New("prometheus host not found")
	}

	port := os.Getenv(promPortEnvName)
	if len(port) == 0 {
		return nil, errors.New("prometheus port not found")
	}
	return &promConfig{
		host: host,
		port: port,
	}, nil
}

func (c *promConfig) Address() string {
	return net.JoinHostPort(c.host, c.port)
}
