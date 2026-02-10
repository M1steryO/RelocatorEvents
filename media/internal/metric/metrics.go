package metric

import (
	"context"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

const (
	namespace = "my_space" //
	appName   = "media"
)

var metrics *Metrics

type Metrics struct {
	requestCounter        prometheus.Counter
	responseCounter       *prometheus.CounterVec
	histogramResponseTime *prometheus.HistogramVec
}

func Init(_ context.Context) error {
	metrics = &Metrics{
		requestCounter: promauto.NewCounter(prometheus.CounterOpts{ // promauto нужен чтобы не регистрировать метрику (сахар)
			Namespace: namespace,
			Subsystem: "grpc",
			Name:      appName + "_requests_total",
			Help:      "Number of requests received.",
		}),
		responseCounter: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: namespace,
				Subsystem: "grpc",
				Name:      appName + "_responses_total",
				Help:      "Number of responses received.",
			},
			[]string{"status", "method"},
		),
		histogramResponseTime: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: namespace,
				Subsystem: "grpc",
				Name:      appName + "_response_time_seconds",
				Help:      "Time of reciving response",
				Buckets:   prometheus.ExponentialBuckets(0.001, 2, 16),
			}, []string{"status"}),
	}
	return nil

}

func IncRequestCounter() {
	metrics.requestCounter.Inc()
}

func IncResponseCounter(status, method string) {
	metrics.responseCounter.WithLabelValues(status, method).Inc()
}

func HistogramResponseTimeObserve(status string, time float64) {
	metrics.histogramResponseTime.WithLabelValues(status).Observe(time)
}
