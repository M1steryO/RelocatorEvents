package config

import (
	"errors"
	"net"
	"os"
	"strings"
)

const (
	httpHostEnvName = "HTTP_HOST"
	httpPortEnvName = "HTTP_PORT"

	corsAllowedOriginEnvName = "CORS_ALLOWED_ORIGINS"
)

type HTTPConfig interface {
	Address() string
	AllowedOrigins() []string
}
type httpConfig struct {
	host           string
	port           string
	allowedOrigins []string
}

func NewHTTPConfig() (HTTPConfig, error) {
	host := os.Getenv(httpHostEnvName)
	if len(host) == 0 {
		return nil, errors.New("http host not found")
	}

	port := os.Getenv(httpPortEnvName)
	if len(port) == 0 {
		return nil, errors.New("http port not found")
	}

	origins := strings.Split(os.Getenv(corsAllowedOriginEnvName), ",")
	if len(origins) == 0 {
		return nil, errors.New("http origins not found")
	}
	var allowed []string
	for _, o := range origins {
		o = strings.TrimSpace(o)
		if o != "" {
			allowed = append(allowed, o)
		}
	}

	return &httpConfig{
		host:           host,
		port:           port,
		allowedOrigins: origins,
	}, nil
}

func (c *httpConfig) Address() string {
	return net.JoinHostPort(c.host, c.port)
}

func (c *httpConfig) AllowedOrigins() []string {
	return c.allowedOrigins
}
