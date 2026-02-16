FROM golang:1.25-alpine AS builder

COPY . /m1stery18/github.com/RelocatorEvents/gateway/source
WORKDIR /m1stery18/github.com/RelocatorEvents/gateway/source

RUN go mod download
RUN go build -o ./bin/gateway cmd/gateway/main.go

FROM alpine:latest
RUN apk add --no-cache wget

WORKDIR /root/
COPY --from=builder /m1stery18/github.com/RelocatorEvents/gateway/source/bin/gateway .
COPY --from=builder /m1stery18/github.com/RelocatorEvents/gateway/source/config ./config

CMD ["./gateway", "-config-path", "config/local.env"]