package http

import (
	grpcClients "github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/client/grpc"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/http/handlers"
	"github.com/M1steryO/RelocatorEvents/gateway/cmd/internal/http/middleware"
	"github.com/go-chi/chi/v5"
	"net/http"
)

type Deps struct {
	Auth grpcClients.AuthServiceClient
	CORS *middleware.CORS
}

func NewRouter(deps Deps) http.Handler {
	r := chi.NewRouter()

	r.Use(deps.CORS.Handler)
	r.Use(middleware.RequestID)
	r.Use(middleware.Logging)

	// public
	r.Get("/healthz", handlers.Health)

	//authMW := middleware.NewAuthMiddleware(deps.Auth)

	//r.Route("/v1", func(r chi.Router) {
	//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
	//})
	//
	//r.Route("/v1", func(r chi.Router) {
	//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
	//})
	//
	//r.Route("/v1", func(r chi.Router) {
	//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
	//})
	//
	//r.Route("/v1", func(r chi.Router) {
	//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
	//})
	//
	//r.Route("/v1", func(r chi.Router) {
	//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
	//})
	//
	//r.Route("/v1", func(r chi.Router) {
	//	r.With(authMW.RequireAuth).Get("/events", handlers.ListEvents)
	//})

	return r
}
