package config

import (
	"errors"
	"os"
)

const (
	loggerEnvName = "ENV"
)

type LoggerConfig interface {
	Env() string
}
type loggerConfig struct {
	env string
}

func NewLoggerConfig() (LoggerConfig, error) {
	env := os.Getenv(loggerEnvName)
	if len(env) == 0 {
		return nil, errors.New("logger env not found")
	}

	return &loggerConfig{
		env: env,
	}, nil
}

func (c *loggerConfig) Env() string {
	return c.env
}
