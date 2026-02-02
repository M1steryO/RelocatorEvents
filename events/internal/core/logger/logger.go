package logger

import (
	"events/internal/core/utils/logger/handlers/slogpretty"
	"log/slog"
	"os"
)

var globalLogger *slog.Logger

const (
	envLocal = "local"
	envDev   = "dev"
	envProd  = "prod"
)

func setupPrettySlog(level slog.Level) *slog.Logger {
	opts := slogpretty.PrettyHandlerOptions{
		SlogOpts: &slog.HandlerOptions{
			Level: level,
		},
	}

	handler := opts.NewPrettyHandler(os.Stdout)

	return slog.New(handler)
}

func Init(env string) {
	switch env {
	case envLocal:
		globalLogger = setupPrettySlog(slog.LevelDebug)
		//globalLogger = slog.New(
		//	slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}),
		//)
	case envDev:
		globalLogger = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}),
		)
	case envProd:
		globalLogger = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}),
		)
	default:
		globalLogger = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}),
		)
	}
}

func Debug(msg string, v ...interface{}) {
	globalLogger.Debug(msg, v...)
}

func Info(msg string, v ...interface{}) {
	globalLogger.Info(msg, v...)
}

func Warn(msg string, v ...interface{}) {
	globalLogger.Warn(msg, v...)
}

func Error(msg string, v ...interface{}) {
	globalLogger.Error(msg, v...)
}
