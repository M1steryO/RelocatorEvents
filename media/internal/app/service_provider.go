package app

import (
	"github.com/M1steryO/RelocatorEvents/media/internal/api/grpc/media"
	"github.com/M1steryO/RelocatorEvents/media/internal/client/kafka"
	"github.com/M1steryO/RelocatorEvents/media/internal/config"
	"github.com/M1steryO/RelocatorEvents/media/internal/infrastructure/s3"
	"github.com/M1steryO/RelocatorEvents/media/internal/service"
	mediaSvc "github.com/M1steryO/RelocatorEvents/media/internal/service/media"
	"github.com/M1steryO/RelocatorEvents/media/internal/storage"
	dbclient "github.com/M1steryO/platform_common/pkg/db"
	"github.com/minio/minio-go"
	"log"
)

type serviceProvider struct {
	grpcConfig        config.GRPCConfig
	loggerConfig      config.LoggerConfig
	promConfig        config.PromConfig
	kafkaConfig       config.KafkaConfig
	authServiceConfig config.AuthServiceConfig
	storageConfig     config.StorageConfig

	mediaImpl *media.MediaImpl

	mediaStorage storage.MediaStorage

	mediaServ service.MediaService

	dbClient  dbclient.Client
	txManager dbclient.TxManager
}

func newServiceProvider() *serviceProvider {
	return &serviceProvider{}
}

func (s *serviceProvider) LoggerConfig() config.LoggerConfig {
	if s.loggerConfig == nil {
		cfg, err := config.NewLoggerConfig()
		if err != nil {
			log.Fatalf("failed to load logger config: %s", err.Error())
		}
		s.loggerConfig = cfg
	}
	return s.loggerConfig
}

func (s *serviceProvider) PromConfig() config.PromConfig {
	if s.promConfig == nil {
		cfg, err := config.NewPromConfig()
		if err != nil {
			log.Fatalf("failed to get prometheus config: %s", err.Error())
		}
		s.promConfig = cfg
	}
	return s.promConfig
}

func (s *serviceProvider) KafkaConfig() config.KafkaConfig {
	if s.kafkaConfig == nil {
		cfg, err := config.NewKafkaConfig()
		if err != nil {
			log.Fatalf("failed to get kafka config: %s", err.Error())
		}
		s.kafkaConfig = cfg
	}
	return s.kafkaConfig
}

func (s *serviceProvider) StorageConfig() config.StorageConfig {
	if s.storageConfig == nil {
		cfg, err := config.NewS3Config()
		if err != nil {
			log.Fatalf("failed to get s3 config: %s", err.Error())
		}
		s.storageConfig = cfg
	}
	return s.storageConfig
}

func (s *serviceProvider) GRPCConfig() config.GRPCConfig {
	if s.grpcConfig == nil {
		cfg, err := config.NewGRPCConfig()
		if err != nil {
			log.Fatalf("failed to get grpc config: %s", err.Error())
		}

		s.grpcConfig = cfg
	}

	return s.grpcConfig
}

func (s *serviceProvider) MediaImpl() *media.MediaImpl {
	if s.mediaImpl == nil {
		s.mediaImpl = media.NewMediaImplementation(s.MediaService())
	}
	return s.mediaImpl
}
func (s *serviceProvider) MediaService() service.MediaService {
	if s.mediaServ == nil {
		cfg := s.StorageConfig()
		client, err := minio.New(cfg.GetEndpoint(), cfg.GetAccessKey(), cfg.GetSecretKey(), cfg.UseSSL())
		if err != nil {
			log.Fatalf("failed to create minio client: %s", err.Error())
		}
		fileStorage := s3.NewFileStorage(client, cfg.GetBucket(), cfg.GetEndpoint())

		producer, err := kafka.NewProducer(s.KafkaConfig().Brokers())
		if err != nil {
			log.Fatalf("failed to create kafka producer: %s", err.Error())
		}

		s.mediaServ = mediaSvc.NewMediaService(fileStorage, producer)
	}
	return s.mediaServ
}
