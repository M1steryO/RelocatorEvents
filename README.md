# RelocatorEvents

RelocatorEvents is a microservice project for finding local events, saving
favourites, writing reviews, and managing user authentication. The backend is
split into Go services, the frontend is a Vite/React app, and the repository also
contains Docker Compose files for local infrastructure.

## Services

- `auth` - login, Telegram login, access and refresh token flow.
- `users` - user profiles, interests, language, country, and profile media data.
- `events` - events catalog, filters, favourites, reviews, and ratings.
- `media` - upload flow and presigned media URLs.
- `gateway` - HTTP gateway that routes frontend requests to backend services.
- `front` - React frontend for the user-facing application.
- `parser` - event parser scripts and cron helper files.


## Requirements

- Go 1.25
- Docker and Docker Compose
- Node.js and npm for `front`
- `protoc` if protobuf files need to be regenerated

## Local Run

Start all backend services defined in the root compose file:

```bash
docker compose up --build
```

If containers already exist and only need to be started:

```bash
./run_containers.sh
```

The frontend can be run separately:

```bash
cd front
npm install
npm run dev
```

Each Go service has its own `config/local.env`, `Dockerfile`, `docker-compose.yml`,
migrations, and `Makefile` targets.

## Tests

Run tests for a single Go service from its directory:

```bash
cd events
go test ./...
```

The service Makefiles also expose a coverage-oriented target:

```bash
cd events
make test
```

Unit tests for business logic should avoid databases and external services. Use
small fakes or generated mocks for repositories, transaction managers, and gRPC
clients, then test the service contract directly.

## Migrations

Migration files are stored in each service's `migrations` directory. The Go
service Makefiles include local goose helpers:

```bash
cd events
make local-migration-status
make local-migration-up
make local-migration-down
```

## Protobuf Generation

After installing code generators with `make install-deps`, regenerate service
contracts from the service directory:

```bash
cd events
make generate
```

Other services expose similar generation targets in their Makefiles.
