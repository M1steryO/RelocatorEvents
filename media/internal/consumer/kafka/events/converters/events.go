package converters

import (
	"strings"
)

func strPtrOrNil(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	v := s
	return &v
}

func int32PtrFromIntPtr(p *int) *int32 {
	if p == nil {
		return nil
	}
	v := int32(*p)
	return &v
}

func float64Ptr(v float64) *float64 {
	// если хочешь игнорировать 0 как "нет значения" — раскомментируй:
	// if v == 0 { return nil }
	x := v
	return &x
}
