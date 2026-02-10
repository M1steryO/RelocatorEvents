package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	kafkaBrokersEnvName = "KAFKA_BROKERS"  // "broker1:9092,broker2:9092"
	kafkaTopicsEnvName  = "KAFKA_TOPICS"   // "media"
	kafkaGroupIDEnvName = "KAFKA_GROUP_ID" // "media-consumer"

	kafkaClientIDEnvName = "KAFKA_CLIENT_ID" // optional
	kafkaUsernameEnvName = "KAFKA_USERNAME"  // optional
	kafkaPasswordEnvName = "KAFKA_PASSWORD"  // optional
	kafkaSASLEnvName     = "KAFKA_SASL_MECH" // optional: "PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512"
	kafkaTLSEnvName      = "KAFKA_TLS"       // optional: "true"/"false"

	kafkaDialTimeoutEnvName = "KAFKA_DIAL_TIMEOUT_MS" // optional
)

const (
	defaultKafkaDialTimeout = 5 * time.Second
)

type KafkaConfig interface {
	Brokers() []string
	Topics() []string
	GroupID() string

	ClientID() string
	Username() string
	Password() string
	SASLMechanism() string
	TLS() bool

	DialTimeout() time.Duration
}

type kafkaConfig struct {
	brokers []string
	topics  []string
	groupID string

	clientID      string
	username      string
	password      string
	saslMechanism string
	tls           bool

	dialTimeout time.Duration
}

func NewKafkaConfig() (KafkaConfig, error) {
	rawBrokers := strings.TrimSpace(os.Getenv(kafkaBrokersEnvName))
	if rawBrokers == "" {
		return nil, errors.New("kafka brokers not found")
	}
	brokers := splitAndCleanCSV(rawBrokers)
	if len(brokers) == 0 {
		return nil, errors.New("kafka brokers not found")
	}

	rawTopics := strings.TrimSpace(os.Getenv(kafkaTopicsEnvName))
	if rawTopics == "" {
		return nil, errors.New("kafka topics not found")
	}
	topics := splitAndCleanCSV(rawTopics)
	if len(topics) == 0 {
		return nil, errors.New("kafka topics not found")
	}

	groupID := strings.TrimSpace(os.Getenv(kafkaGroupIDEnvName))
	if groupID == "" {
		return nil, errors.New("kafka group id not found")
	}

	clientID := strings.TrimSpace(os.Getenv(kafkaClientIDEnvName))
	username := strings.TrimSpace(os.Getenv(kafkaUsernameEnvName))
	password := os.Getenv(kafkaPasswordEnvName) // пароль лучше не TrimSpace
	saslMechanism := strings.TrimSpace(os.Getenv(kafkaSASLEnvName))

	tls := parseBoolOrDefault(os.Getenv(kafkaTLSEnvName), false)

	dialTimeout := defaultKafkaDialTimeout
	if v := strings.TrimSpace(os.Getenv(kafkaDialTimeoutEnvName)); v != "" {
		if ms, err := strconv.Atoi(v); err == nil && ms > 0 {
			dialTimeout = time.Duration(ms) * time.Millisecond
		}
	}

	return &kafkaConfig{
		brokers: brokers,
		topics:  topics,
		groupID: groupID,

		clientID:      clientID,
		username:      username,
		password:      password,
		saslMechanism: saslMechanism,
		tls:           tls,

		dialTimeout: dialTimeout,
	}, nil
}

func (c *kafkaConfig) Brokers() []string          { return c.brokers }
func (c *kafkaConfig) Topics() []string           { return c.topics }
func (c *kafkaConfig) GroupID() string            { return c.groupID }
func (c *kafkaConfig) ClientID() string           { return c.clientID }
func (c *kafkaConfig) Username() string           { return c.username }
func (c *kafkaConfig) Password() string           { return c.password }
func (c *kafkaConfig) SASLMechanism() string      { return c.saslMechanism }
func (c *kafkaConfig) TLS() bool                  { return c.tls }
func (c *kafkaConfig) DialTimeout() time.Duration { return c.dialTimeout }

// helpers

func splitAndCleanCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func parseBoolOrDefault(s string, def bool) bool {
	if strings.TrimSpace(s) == "" {
		return def
	}
	v, err := strconv.ParseBool(s)
	if err != nil {
		return def
	}
	return v
}
