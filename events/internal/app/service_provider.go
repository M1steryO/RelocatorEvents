package app

import (
	"context"
	"events/internal/api/grpc/events"
	"events/internal/api/grpc/reviews"
	"events/internal/config"
	eventsConsumer "events/internal/consumer/kafka/events"
	"events/internal/repository"
	repo "events/internal/repository/events"
	reviewsRepo "events/internal/repository/reviews"
	"events/internal/service"
	serv "events/internal/service/events"
	reviewsServ "events/internal/service/reviews"
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
	kafkaConfig  config.KafkaConfig

	eventRepository  repository.EventRepository
	reviewRepository repository.ReviewRepository

	dbClient  dbclient.Client
	txManager dbclient.TxManager

	eventService  service.EventService
	reviewService service.ReviewService

	eventsImpl  *events.EventsImplementation
	reviewsImpl *reviews.ReviewsImplementation

	eventsHandler *eventsConsumer.EventsHandler
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

func (s *serviceProvider) EventRepository(ctx context.Context) repository.EventRepository {
	if s.eventRepository == nil {
		s.eventRepository = repo.NewEventRepository(s.DBCClient(ctx))
	}

	return s.eventRepository
}

func (s *serviceProvider) EventService(ctx context.Context) service.EventService {
	if s.eventService == nil {
		s.eventService = serv.NewEventService(
			s.EventRepository(ctx),
			s.TxManager(ctx),
		)
	}

	return s.eventService
}

func (s *serviceProvider) EventsImpl(ctx context.Context) *events.EventsImplementation {
	if s.eventsImpl == nil {
		s.eventsImpl = events.NewEventsImplementation(s.EventService(ctx))
	}

	return s.eventsImpl
}

func (s *serviceProvider) ReviewRepository(ctx context.Context) repository.ReviewRepository {
	if s.reviewRepository == nil {
		s.reviewRepository = reviewsRepo.NewReviewsRepository(s.DBCClient(ctx))
	}

	return s.reviewRepository
}

func (s *serviceProvider) ReviewService(ctx context.Context) service.ReviewService {
	if s.reviewService == nil {
		s.reviewService = reviewsServ.NewReviewService(
			s.ReviewRepository(ctx),
			s.EventRepository(ctx),
			s.TxManager(ctx),
		)
	}

	return s.reviewService
}

func (s *serviceProvider) ReviewsImpl(ctx context.Context) *reviews.ReviewsImplementation {
	if s.reviewsImpl == nil {
		s.reviewsImpl = reviews.NewReviewsImplementation(s.ReviewService(ctx))
	}

	return s.reviewsImpl
}

func (s *serviceProvider) EventsHandler(ctx context.Context) *eventsConsumer.EventsHandler {
	if s.eventsHandler == nil {
		s.eventsHandler = eventsConsumer.NewEventsHandler(s.EventService(ctx))
	}
	return s.eventsHandler
}
