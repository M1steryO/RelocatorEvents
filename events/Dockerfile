FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc musl-dev pkgconfig librdkafka-dev

COPY . /m1stery18/github.com/RelocatorEvents/events/source
WORKDIR /m1stery18/github.com/RelocatorEvents/events/source

RUN go mod download 

ENV CGO_ENABLED=1
RUN go build -tags musl -o ./bin/events ./cmd/events/main.go

FROM alpine:latest
RUN apk add --no-cache librdkafka

WORKDIR /root/
COPY --from=builder /m1stery18/github.com/RelocatorEvents/events/source/bin/events .
COPY --from=builder /m1stery18/github.com/RelocatorEvents/events/source/config ./config

CMD ["./events", "-config-path", "config/local.env"]