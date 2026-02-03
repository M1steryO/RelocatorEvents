package app

import (
	"context"
	"flag"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/config"
	router "github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/http"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/http/middleware"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/logger"
	"github.com/M1steryO/platform_common/pkg/closer"

	"google.golang.org/grpc"
	"log"
	"net/http"
	"sync"
)

var configPath = ""

func init() {
	flag.StringVar(&configPath, "config-path", "local.env", "path to config file")
}

type App struct {
	serviceProvider *serviceProvider
	grpcServer      *grpc.Server
	httpServer      *http.Server
}

func NewApp(ctx context.Context) (*App, error) {
	a := &App{}
	err := a.initDeps(ctx)

	if err != nil {
		return nil, err
	}
	return a, nil
}

func (a *App) Run() error {
	defer func() {
		closer.CloseAll()
		closer.Wait()
	}()
	wg := sync.WaitGroup{}
	wg.Add(3)

	go func() {
		defer wg.Done()
		err := a.runHTTPServer()
		if err != nil {
			log.Fatal("failed to run http server: ", err)
		}
	}()

	logger.Init(a.serviceProvider.LoggerConfig().Env())

	wg.Wait()
	return nil
}

func (a *App) initDeps(ctx context.Context) error {
	inits := []func(context.Context) error{
		a.initConfig,
		a.initServiceProvider,
		a.initHTTPServer,
	}

	for _, f := range inits {
		err := f(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

func (a *App) initConfig(_ context.Context) error {
	flag.Parse()
	err := config.Load(configPath)
	if err != nil {
		return err
	}

	return nil
}

func (a *App) initServiceProvider(_ context.Context) error {
	a.serviceProvider = newServiceProvider()
	return nil
}

func (a *App) initHTTPServer(ctx context.Context) error {

	cors := middleware.NewCORS(a.serviceProvider.HTTPConfig().AllowedOrigins())

	r := router.NewRouter(router.Deps{
		CORS: cors,
		Auth: a.serviceProvider.AuthServiceClient(),
	})

	a.httpServer = &http.Server{
		Addr:    a.serviceProvider.HTTPConfig().Address(),
		Handler: r,
	}
	return nil
}

func (a *App) runHTTPServer() error {
	log.Printf("HTTP server is running on %s", a.serviceProvider.HTTPConfig().Address())

	err := a.httpServer.ListenAndServe()
	if err != nil {
		return err
	}
	return nil
}
