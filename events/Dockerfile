FROM golang:1.23-alpine AS builder

COPY . /m1stery18/github.com/RelocatorEvents/events/source
WORKDIR /m1stery18/github.com/RelocatorEvents/events/source

RUN go mod download
RUN go build -o ./bin/events cmd/events/main.go

FROM alpine:latest

WORKDIR /root/
COPY --from=builder /m1stery18/github.com/RelocatorEvents/events/source/bin/events .

CMD ["./events", "-config-path", "config/local.env"]