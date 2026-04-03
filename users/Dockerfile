FROM golang:1.24-alpine AS builder

COPY . /m1stery18/github.com/RelocatorEvents/users/source
WORKDIR /m1stery18/github.com/RelocatorEvents/users/source

RUN go mod download
RUN go build -o ./bin/users ./cmd/users/main.go

FROM alpine:latest

WORKDIR /root/
COPY --from=builder /m1stery18/github.com/RelocatorEvents/users/source/bin/users .
COPY --from=builder /m1stery18/github.com/RelocatorEvents/users/source/config ./config

CMD ["./users", "--config-path", "config/prod.env"]
