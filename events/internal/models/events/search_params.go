package events

import (
	"github.com/M1steryO/RelocatorEvents/events/internal/core/logger"
	"time"
)

type Preset string

const (
	PresetToday    Preset = "today"
	PresetTomorrow Preset = "tomorrow"
	PresetWeekends Preset = "weekends"
	PresetWeekdays Preset = "weekdays"
)

type EventDate struct {
	Date   *time.Time
	Preset *Preset
}

func safeLocation(tz string) *time.Location {
	if tz == "" {
		return time.UTC
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		logger.Error("failed to load timezone, fallback to UTC",
			"tz", tz,
			"err", err.Error(),
		)
		return time.UTC
	}
	return loc
}

func (e *EventDate) ToRange(tz string) (time.Time, time.Time) {
	loc := safeLocation(tz)
	now := time.Now().In(loc)

	if e.Date != nil {
		logger.Info(e.Date.String())
		start := time.Date(e.Date.Year(), e.Date.Month(), e.Date.Day(), 0, 0, 0, 0, loc)
		return start, start.Add(24 * time.Hour)
	}

	switch *e.Preset {
	case PresetToday:
		start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		return start, start.Add(24 * time.Hour)

	case PresetTomorrow:
		start := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, loc)
		return start, start.Add(24 * time.Hour)

	case PresetWeekends:
		weekday := now.Weekday()
		daysUntilSat := (time.Saturday - weekday + 7) % 7
		sat := now.AddDate(0, 0, int(daysUntilSat))
		start := time.Date(sat.Year(), sat.Month(), sat.Day(), 0, 0, 0, 0, loc)
		return start, start.Add(48 * time.Hour)

	case PresetWeekdays:
		wd := now.Weekday()
		if wd >= time.Monday && wd <= time.Friday {
			start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
			// конец — пятница
			daysToFri := int(time.Friday - wd)
			end := start.AddDate(0, 0, daysToFri+1) // exclusive
			return start, end
		}

		// иначе (Sat = 6, Sun = 0) — перенос на ближайший Mon
		daysUntilMon := (int(time.Monday) - int(wd) + 7) % 7
		start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).
			AddDate(0, 0, daysUntilMon)
		end := start.AddDate(0, 0, 5)
		return start, end
	}

	panic("unknown preset")
}

type SearchParams struct {
	Q        *string
	Sort     *string
	City     *string
	District *string

	MinPrice *int32
	MaxPrice *int32

	EventDate *EventDate

	EventType  *EventType
	Categories []string

	Limit  *int64
	LastID *int64
	Offset *int64
}
