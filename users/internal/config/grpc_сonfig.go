package config

import (
	"errors"
	"net"
	"os"
	"strconv"
)

const (
	grpcHostEnvName  = "GRPC_HOST"
	grpcPortEnvName  = "GRPC_PORT"
	rateLimitEnvName = "GRPC_RATE_LIMIT"

	defaultGRPCRateLimit = 10
)

type GRPCConfig interface {
	Address() string
	RateLimit() int
}
type grpcConfig struct {
	host      string
	port      string
	rateLimit int
}

func NewGRPCConfig() (GRPCConfig, error) {
	host := os.Getenv(grpcHostEnvName)
	if len(host) == 0 {
		return nil, errors.New("grpc host not found")
	}

	port := os.Getenv(grpcPortEnvName)
	if len(port) == 0 {
		return nil, errors.New("grpc port not found")
	}

	rateLimit, err := strconv.Atoi(os.Getenv(rateLimitEnvName))
	if err != nil {
		rateLimit = defaultGRPCRateLimit
	}
	return &grpcConfig{
		host:      host,
		port:      port,
		rateLimit: rateLimit,
	}, nil
}

func (c *grpcConfig) Address() string {
	return net.JoinHostPort(c.host, c.port)
}

func (c *grpcConfig) RateLimit() int {
	return c.rateLimit
}
