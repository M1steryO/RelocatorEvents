package config

import (
	"errors"
	"os"
	"time"
)

const (
	accessTokenSecretEnvName  = "ACCESS_TOKEN_SECRET_KEY"
	refreshTokenSecretEnvName = "REFRESH_TOKEN_SECRET_KEY"
	accessTokenExpEnvName     = "ACCESS_TOKEN_EXPIRATION"
	refreshTokenExpEnvName    = "REFRESH_TOKEN_EXPIRATION"
)

type JWTConfig interface {
	AccessSecret() []byte
	RefreshSecret() []byte
	AccessExpiration() time.Duration
	RefreshExpiration() time.Duration
}

type jwtConfig struct {
	accessSecret      []byte
	refreshSecret     []byte
	accessExpiration  time.Duration
	refreshExpiration time.Duration
}

func NewJWTConfig() (JWTConfig, error) {
	accessSecret := os.Getenv(accessTokenSecretEnvName)
	if accessSecret == "" {
		return nil, errors.New("access token secret not found")
	}

	refreshSecret := os.Getenv(refreshTokenSecretEnvName)
	if refreshSecret == "" {
		return nil, errors.New("refresh token secret not found")
	}

	accessExpStr := os.Getenv(accessTokenExpEnvName)
	if accessExpStr == "" {
		return nil, errors.New("access token expiration not found")
	}

	refreshExpStr := os.Getenv(refreshTokenExpEnvName)
	if refreshExpStr == "" {
		return nil, errors.New("refresh token expiration not found")
	}

	accessExp, err := time.ParseDuration(accessExpStr)
	if err != nil {
		return nil, errors.New("invalid access token expiration")
	}

	refreshExp, err := time.ParseDuration(refreshExpStr)
	if err != nil {
		return nil, errors.New("invalid refresh token expiration")
	}

	return &jwtConfig{
		accessSecret:      []byte(accessSecret),
		refreshSecret:     []byte(refreshSecret),
		accessExpiration:  accessExp,
		refreshExpiration: refreshExp,
	}, nil
}

func (c *jwtConfig) AccessSecret() []byte {
	return c.accessSecret
}

func (c *jwtConfig) RefreshSecret() []byte {
	return c.refreshSecret
}

func (c *jwtConfig) AccessExpiration() time.Duration {
	return c.accessExpiration
}

func (c *jwtConfig) RefreshExpiration() time.Duration {
	return c.refreshExpiration
}
