package app

import (
	"github.com/M1steryO/RelocatorEvents/auth/pkg/auth_v1"
	"github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
	grpcClients "github.com/M1steryO/RelocatorEvents/gateway/internal/client/grpc"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/client/grpc/auth"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/client/grpc/users"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/config"
	"github.com/grpc-ecosystem/grpc-opentracing/go/otgrpc"
	"github.com/opentracing/opentracing-go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"log"
)

type serviceProvider struct {
	httpConfig          config.HTTPConfig
	telegramConfig      config.TelegramConfig
	loggerConfig        config.LoggerConfig
	authServiceConfig   config.AuthServiceConfig
	eventsServiceConfig config.AuthServiceConfig
	mediaServiceConfig  config.MediaServiceConfig

	authServiceClient grpcClients.AuthServiceClient
	userServiceClient grpcClients.UserServiceClient
}

func newServiceProvider() *serviceProvider {
	return &serviceProvider{}
}
func (s *serviceProvider) TelegramConfig() config.TelegramConfig {
	if s.telegramConfig == nil {
		cfg, err := config.NewTelegramConfig()
		if err != nil {
			log.Fatalf("failed to load telegram config: %s", err.Error())
		}
		s.telegramConfig = cfg
	}
	return s.telegramConfig
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

func (s *serviceProvider) HTTPConfig() config.HTTPConfig {
	if s.httpConfig == nil {
		cfg, err := config.NewHTTPConfig()
		if err != nil {
			log.Fatalf("failed to get http config: %s", err.Error())
		}
		s.httpConfig = cfg
	}
	return s.httpConfig
}

func (s *serviceProvider) AuthServiceConfig() config.AuthServiceConfig {
	if s.authServiceConfig == nil {
		cfg, err := config.NewAuthServiceConfig()
		if err != nil {
			log.Fatalf("failed to get auth service config: %s", err.Error())
		}
		s.authServiceConfig = cfg
	}
	return s.authServiceConfig
}

func (s *serviceProvider) EventsServiceConfig() config.EventsServiceConfig {
	if s.eventsServiceConfig == nil {
		cfg, err := config.NewEventsServiceConfig()
		if err != nil {
			log.Fatalf("failed to get events service config: %s", err.Error())
		}
		s.eventsServiceConfig = cfg
	}
	return s.eventsServiceConfig
}

func (s *serviceProvider) MediaServiceConfig() config.MediaServiceConfig {
	if s.mediaServiceConfig == nil {
		cfg, err := config.NewMediaServiceConfig()
		if err != nil {
			log.Fatalf("failed to get media service config: %s", err.Error())
		}
		s.mediaServiceConfig = cfg
	}
	return s.mediaServiceConfig
}

func (s *serviceProvider) AuthServiceClient() grpcClients.AuthServiceClient {
	if s.authServiceClient == nil {
		conn, err := grpc.NewClient(
			s.AuthServiceConfig().GetAddress(),
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithUnaryInterceptor(otgrpc.OpenTracingClientInterceptor(opentracing.GlobalTracer())))
		if err != nil {
			log.Fatalf("failed to connect to auth service: %s", err.Error())
		}
		s.authServiceClient = auth.NewAuthServiceClient(auth_v1.NewAuthV1Client(conn))
	}
	return s.authServiceClient
}

func (s *serviceProvider) UserServiceClient() grpcClients.UserServiceClient {
	if s.userServiceClient == nil {
		conn, err := grpc.NewClient(
			s.AuthServiceConfig().GetAddress(),
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithUnaryInterceptor(otgrpc.OpenTracingClientInterceptor(opentracing.GlobalTracer())))
		if err != nil {
			log.Fatalf("failed to connect to auth service: %s", err.Error())
		}
		s.userServiceClient = users.NewUserServiceClient(user_v1.NewUserV1Client(conn))
	}
	return s.userServiceClient
}
