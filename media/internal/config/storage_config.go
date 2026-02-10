package config

import (
	"errors"
	"os"
)

const (
	s3EndpointEnvName  = "S3_ENDPOINT"
	s3AccessKeyEnvName = "S3_ACCESS_KEY"
	s3SecretKeyEnvName = "S3_SECRET_KEY"
	s3BucketEnvName    = "S3_BUCKET"
	s3RegionEnvName    = "S3_REGION"
	s3UseSSLEnvName    = "S3_USE_SSL"
)

type StorageConfig interface {
	GetEndpoint() string
	GetAccessKey() string
	GetSecretKey() string
	GetBucket() string
	GetRegion() string
	UseSSL() bool
}

type s3Config struct {
	endpoint  string
	accessKey string
	secretKey string
	bucket    string
	region    string
	useSSL    bool
}

func NewS3Config() (*s3Config, error) {
	endpoint := os.Getenv(s3EndpointEnvName)
	if endpoint == "" {
		return nil, errors.New(s3EndpointEnvName + " is not set")
	}

	accessKey := os.Getenv(s3AccessKeyEnvName)
	if accessKey == "" {
		return nil, errors.New(s3AccessKeyEnvName + " is not set")
	}

	secretKey := os.Getenv(s3SecretKeyEnvName)
	if secretKey == "" {
		return nil, errors.New(s3SecretKeyEnvName + " is not set")
	}

	bucket := os.Getenv(s3BucketEnvName)
	if bucket == "" {
		return nil, errors.New(s3BucketEnvName + " is not set")
	}

	region := os.Getenv(s3RegionEnvName)
	if region == "" {
		return nil, errors.New(s3RegionEnvName + " is not set")
	}

	useSSL := os.Getenv(s3UseSSLEnvName) == "true"

	return &s3Config{
		endpoint:  endpoint,
		accessKey: accessKey,
		secretKey: secretKey,
		bucket:    bucket,
		region:    region,
		useSSL:    useSSL,
	}, nil
}

func (c *s3Config) GetEndpoint() string {
	return c.endpoint
}

func (c *s3Config) GetAccessKey() string {
	return c.accessKey
}

func (c *s3Config) GetSecretKey() string {
	return c.secretKey
}

func (c *s3Config) GetBucket() string {
	return c.bucket
}

func (c *s3Config) GetRegion() string {
	return c.region
}

func (c *s3Config) UseSSL() bool {
	return c.useSSL
}
