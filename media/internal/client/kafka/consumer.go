package kafka

import (
	"context"
	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"log"
	"strings"
)

const (
	consumerGroup  = "media-service"
	sessionTimeout = 20000
	noTimeout      = -1
)

type Handler interface {
	Handle(ctx context.Context, msg []byte, topic kafka.TopicPartition, consumerNumber int) error
}

type Consumer struct {
	consumer       *kafka.Consumer
	handler        Handler
	stop           bool
	consumerNumber int
}

func NewConsumer(address, topics []string, handler Handler, cn int) (*Consumer, error) {
	configMap := kafka.ConfigMap{
		"bootstrap.servers":        strings.Join(address, ","),
		"group.id":                 consumerGroup,  // символичное имя для консьюмеров сервиса
		"session.timeout.ms":       sessionTimeout, // консьюмер с этим таймаутом отправляет сигналы о том что он жив, если нет то кафка убирает его из группы
		"auto.offset.reset":        "earliest",     // earliest - с самого начала; largest - самые новые
		"enable.auto.commit":       true,
		"enable.auto.offset.store": false, // не очень безопасно в true
		//"enable.commit.interval.ms": 500,
	}
	// CGO_ENABLED = 1 - должен быть при билде
	// lag-разница между offset который мы прочитали последний раз и последрим записанным в партицию(лаг растет - плохо!)
	c, err := kafka.NewConsumer(&configMap)
	if err != nil {
		return nil, err
	}

	if err = c.SubscribeTopics(topics, nil); err != nil {
		return nil, err
	}
	return &Consumer{
		consumer:       c,
		handler:        handler,
		consumerNumber: cn,
	}, nil
}

func (c *Consumer) Start(ctx context.Context) error {
	for {
		if c.stop {
			break
		}
		msg, err := c.consumer.ReadMessage(noTimeout)
		if err != nil {
			log.Printf("Error reading message from consumer: %v", err)
		}
		if msg == nil {
			continue
		}
		if err = c.handler.Handle(ctx, msg.Value, msg.TopicPartition, c.consumerNumber); err != nil {
			log.Printf("Error handling message: %v", err)
		}
		if _, err = c.consumer.StoreMessage(msg); err != nil {
			log.Printf("Error storing message: %v", err)
		}
	}
	return nil
}

func (c *Consumer) Stop() error {
	c.stop = true
	if _, err := c.consumer.Commit(); err != nil {
		return err // доотправка оффсетов прочитанных сообщений при остановке
	}
	return c.consumer.Close()
}
