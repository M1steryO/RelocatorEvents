include config/local.env

LOCAL_BIN:=$(CURDIR)/bin

install-golangci-lint:
	GOBIN=$(LOCAL_BIN) go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.3.0

lint:
	$(LOCAL_BIN)/golangci-lint run ./... --config .golangci.pipeline.yaml

LOCAL_MIGRATION_DIR=$(MIGRATION_DIR)
LOCAL_MIGRATION_DSN="host=localhost port=$(PG_PORT) dbname=$(PG_DATABASE_NAME) user=$(PG_USER) password=$(PG_PASSWORD) sslmode=disable"


install-deps:
	GOBIN=$(LOCAL_BIN) go install google.golang.org/protobuf/cmd/protoc-gen-go@latest # Для структур
	GOBIN=$(LOCAL_BIN) go install -mod=mod google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1 # Для gRPC сервера и клиента gRPC
	GOBIN=$(LOCAL_BIN) go install github.com/pressly/goose/v3/cmd/goose@v3.14.0 # для миграций
	GOBIN=$(LOCAL_BIN) go install github.com/gojuno/minimock/v3/cmd/minimock@latest
	GOBIN=$(LOCAL_BIN) go install  github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest
	GOBIN=$(LOCAL_BIN) go install  github.com/envoyproxy/protoc-gen-validate@latest

vendor-proto:
	@if [ ! -d vendor.protogen/validate ]; then \
		mkdir -p vendor.protogen/validate && \
		git clone https://github.com/envoyproxy/protoc-gen-validate vendor.protogen/protoc-gen-validate && \
		mv vendor.protogen/protoc-gen-validate/validate/*.proto vendor.protogen/validate && \
		rm -rf vendor.protogen/protoc-gen-validate ;\
	fi

	@if [ ! -d vendor.protogen/google ]; then \
		git clone https://github.com/googleapis/googleapis vendor.protogen/googleapis && \
		mkdir -p vendor.protogen/google/ && \
		mv vendor.protogen/googleapis/google/api vendor.protogen/google && \
		rm -rf vendor.protogen/googleapis ;\
	fi

get-deps:
	go get -u google.golang.org/protobuf/cmd/protoc-gen-go
	go get -u google.golang.org/grpc/cmd/protoc-gen-go-grpc


generate:
	make generate-events-api
	make generates-reviews-api

generate-events-api:
	mkdir -p pkg/events_v1
	# Указываем путь, где искать .proto файлы и их импорты
 	# --go_out: выходная директория для сгенерированных структур Protobuf
 	# --go_opt: опции для Go-генератора
	# paths=source_relative - сохраняет структуру директорий как в исходниках
	# Указываем путь к плагину protoc-gen-go (генератор Go-кода)
 	# Генерируем Go-код для gRPC сервисов
   # --go-grpc_out: выходная директория для gRPC-кода
   # --go-grpc_opt: опции для gRPC-генератора
   # paths=source_relative - аналогично для gRPC-кода
   # Указываем путь к плагину protoc-gen-go-grpc (генератор gRPC-кода)
   # Исходный .proto файл для компиляции
	protoc --proto_path api/events_v1 --proto_path vendor.protogen\
        --go_out pkg/events_v1 \
        --go_opt=paths=source_relative \
        --plugin=protoc-gen-go=bin/protoc-gen-go \
        --go-grpc_out=pkg/events_v1 \
        --go-grpc_opt=paths=source_relative \
        --plugin=protoc-gen-go-grpc=bin/protoc-gen-go-grpc \
        --validate_out lang=go:pkg/events_v1 --validate_opt=paths=source_relative \
        --plugin=protoc-gen-validate=bin/protoc-gen-validate \
        --grpc-gateway_out=pkg/events_v1 --grpc-gateway_opt=paths=source_relative \
        --plugin=protoc-gen-grpc-gateway=bin/protoc-gen-grpc-gateway \
        api/events_v1/events.proto

generates-reviews-api:
	mkdir -p pkg/reviews_v1
	protoc --proto_path api/reviews_v1 --proto_path vendor.protogen\
			--go_out pkg/reviews_v1 \
			--go_opt=paths=source_relative \
			--plugin=protoc-gen-go=bin/protoc-gen-go \
			--go-grpc_out=pkg/reviews_v1 \
			--go-grpc_opt=paths=source_relative \
			--plugin=protoc-gen-go-grpc=bin/protoc-gen-go-grpc \
			--validate_out lang=go:pkg/reviews_v1 --validate_opt=paths=source_relative \
			--plugin=protoc-gen-validate=bin/protoc-gen-validate \
			--grpc-gateway_out=pkg/reviews_v1 --grpc-gateway_opt=paths=source_relative \
			--plugin=protoc-gen-grpc-gateway=bin/protoc-gen-grpc-gateway \
			api/reviews_v1/reviews.proto


local-migration-status:
	${LOCAL_BIN}/goose -dir ${LOCAL_MIGRATION_DIR} postgres ${LOCAL_MIGRATION_DSN} status -v

local-migration-up:
	${LOCAL_BIN}/goose -dir ${LOCAL_MIGRATION_DIR} postgres ${LOCAL_MIGRATION_DSN} up -v

local-migration-down:
	${LOCAL_BIN}/goose -dir ${LOCAL_MIGRATION_DIR} postgres ${LOCAL_MIGRATION_DSN} down -v

create-migration-example:
	${LOCAL_BIN}/goose -dir=./migrations create create_table_events sql


test:
	go clean -testcache
	go test ./... -covermode count -coverpkg=./internal/service/...,./internal/api/... -count 5

test-coverage:
	go clean -testcache
	go test ./... -coverprofile=coverage.tmp.out -covermode count -coverpkg=./internal/service/...,./internal/api/... -count 5
	grep -v 'mocks\|config' coverage.tmp.out  > coverage.out
	rm coverage.tmp.out
	go tool cover -html=coverage.out;
	go tool cover -func=./coverage.out | grep "total";
	grep -sqFx "/coverage.out" .gitignore || echo "/coverage.out" >> .gitignore


grpc-load-test:
	ghz \
		--proto api/events_v1/events.proto \
		-i vendor.protogen \
		--call events_v1.EventsV1.Get \
		--data '{"id": 1}' \
		--rps 100 \
		--total 3000 \
		--insecure \
		localhost:50051

grpc-error-load-test:
	ghz \
		--proto api/events_v1/events.proto \
		-i vendor.protogen \
		--call events_v1.EventsV1.Get \
		--data '{"id": 0}' \
		--rps 100 \
		--total 3000 \
		--insecure \
		localhost:50051
