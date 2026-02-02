package app

import (
	"auth/internal/api/grpc/access"
	"auth/internal/api/grpc/auth"
	"auth/internal/api/grpc/user"
	"auth/internal/config"
	"auth/internal/repository"
	db "auth/internal/repository/user"
	"auth/internal/service"
	serv "auth/internal/service/user"
	"context"
	"github.com/M1steryO/platform_common/pkg/closer"
	dbclient "github.com/M1steryO/platform_common/pkg/db"
	"github.com/M1steryO/platform_common/pkg/db/pg"
	"github.com/M1steryO/platform_common/pkg/db/transaction"
	"log"
)

type serviceProvider struct {
	dbConfig     config.DBConfig
	grpcConfig   config.GRPCConfig
	httpConfig   config.HTTPConfig
	loggerConfig config.LoggerConfig
	promConfig   config.PromConfig

	userRepository repository.UserRepository
	dbClient       dbclient.Client
	txManager      dbclient.TxManager

	userService service.UserService

	userImpl   *user.Implementation
	authImpl   *auth.Implementation
	accessImpl *access.Implementation
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

func (s *serviceProvider) DBConfig() config.DBConfig {
	if s.dbConfig == nil {
		cfg, err := config.NewDBConfig()
		if err != nil {
			log.Fatalf("failed to get pg config: %s", err.Error())
		}

		s.dbConfig = cfg
	}

	return s.dbConfig
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

func (s *serviceProvider) DBCClient(ctx context.Context) dbclient.Client {
	if s.dbClient == nil {
		cl, err := pg.New(ctx, s.DBConfig().GetDSN())
		if err != nil {
			log.Fatalf("failed to connect to db: %s", err.Error())
		}
		err = cl.DB().Ping(ctx)
		if err != nil {
			log.Fatalf("failed to ping db: %s", err.Error())
		}
		s.dbClient = cl
		closer.Add(cl.Close)
	}
	return s.dbClient

}

func (s *serviceProvider) TxManager(ctx context.Context) dbclient.TxManager {
	if s.txManager == nil {
		s.txManager = transaction.NewTxManager(s.DBCClient(ctx).DB())
	}
	return s.txManager
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

func (s *serviceProvider) UserRepository(ctx context.Context) repository.UserRepository {
	if s.userRepository == nil {
		s.userRepository = db.NewUserRepository(s.DBCClient(ctx))
	}

	return s.userRepository
}

func (s *serviceProvider) UserService(ctx context.Context) service.UserService {
	if s.userService == nil {
		s.userService = serv.NewUserService(
			s.UserRepository(ctx),
			s.TxManager(ctx),
		)
	}

	return s.userService
}

func (s *serviceProvider) UserImpl(ctx context.Context) *user.Implementation {
	if s.userImpl == nil {
		s.userImpl = user.NewUserImplementation(s.UserService(ctx))
	}

	return s.userImpl
}

func (s *serviceProvider) AuthImpl(ctx context.Context) *auth.Implementation {
	if s.authImpl == nil {
		s.authImpl = auth.NewImplementation(s.UserService(ctx))
	}
	return s.authImpl
}

func (s *serviceProvider) AccessImpl(ctx context.Context) *access.Implementation {
	if s.accessImpl == nil {
		s.accessImpl = access.NewImplementation(s.UserService(ctx))
	}
	return s.accessImpl
}
