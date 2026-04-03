package app

import (
	"context"
	"log"

	"github.com/M1steryO/RelocatorEvents/auth/internal/api/grpc/auth"
	usersclient "github.com/M1steryO/RelocatorEvents/auth/internal/client/grpc/users"
	"github.com/M1steryO/RelocatorEvents/auth/internal/config"
	"github.com/M1steryO/RelocatorEvents/auth/internal/core/utils/telegram"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	authSvc "github.com/M1steryO/RelocatorEvents/auth/internal/service/auth"
	userproto "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"
	"github.com/M1steryO/platform_common/pkg/closer"
	"github.com/grpc-ecosystem/grpc-opentracing/go/otgrpc"
	"github.com/opentracing/opentracing-go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type serviceProvider struct {
	grpcConfig       config.GRPCConfig
	httpConfig       config.HTTPConfig
	loggerConfig     config.LoggerConfig
	promConfig       config.PromConfig
	telegramConfig   config.TelegramConfig
	jwtConfig        config.JWTConfig
	usersServiceCfg  config.UsersServiceConfig
	usersGRPCConn    *grpc.ClientConn
	userService      service.UserService
	authService      service.AuthService
	telegramAuth     *telegram.TelegramAuthenticator
	authImpl         *auth.Implementation
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

func (s *serviceProvider) JWTConfig() config.JWTConfig {
	if s.jwtConfig == nil {
		cfg, err := config.NewJWTConfig()
		if err != nil {
			log.Fatalf("failed to get jwt config: %s", err.Error())
		}
		s.jwtConfig = cfg
	}
	return s.jwtConfig
}

func (s *serviceProvider) UsersServiceConfig() config.UsersServiceConfig {
	if s.usersServiceCfg == nil {
		cfg, err := config.NewUsersServiceConfig()
		if err != nil {
			log.Fatalf("failed to get users service config: %s", err.Error())
		}
		s.usersServiceCfg = cfg
	}
	return s.usersServiceCfg
}

func (s *serviceProvider) UsersGRPCConn(ctx context.Context) *grpc.ClientConn {
	if s.usersGRPCConn == nil {
		conn, err := grpc.NewClient(
			s.UsersServiceConfig().GetAddress(),
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithUnaryInterceptor(otgrpc.OpenTracingClientInterceptor(opentracing.GlobalTracer())),
		)
		if err != nil {
			log.Fatalf("failed to connect to users service: %s", err.Error())
		}
		s.usersGRPCConn = conn
		closer.Add(conn.Close)
	}
	return s.usersGRPCConn
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

func (s *serviceProvider) UserService(ctx context.Context) service.UserService {
	if s.userService == nil {
		cli := userproto.NewUserServiceClient(s.UsersGRPCConn(ctx))
		s.userService = usersclient.NewUserService(cli)
	}

	return s.userService
}

func (s *serviceProvider) TelegramAuth(ctx context.Context) *telegram.TelegramAuthenticator {
	if s.telegramAuth == nil {
		secret := telegram.GenerateSecretKey(s.TelegramConfig().Token())
		s.telegramAuth = telegram.NewTelegramAuthenticator(secret)
	}
	return s.telegramAuth
}

func (s *serviceProvider) AuthImpl(ctx context.Context) *auth.Implementation {
	if s.authImpl == nil {

		s.authImpl = auth.NewImplementation(s.AuthService(ctx))
	}
	return s.authImpl
}

func (s *serviceProvider) AuthService(ctx context.Context) service.AuthService {
	if s.authService == nil {

		s.authService = authSvc.NewAuthService(s.UserService(ctx), s.TelegramAuth(ctx), s.JWTConfig())
	}
	return s.authService
}
