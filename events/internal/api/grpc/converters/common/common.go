package common

import (
	"google.golang.org/protobuf/types/known/timestamppb"
	"google.golang.org/protobuf/types/known/wrapperspb"
	"time"
)

func TimeToProto(t *time.Time) *timestamppb.Timestamp {
	var protoTime *timestamppb.Timestamp
	if t != nil {
		protoTime = timestamppb.New(*t)
	}
	return protoTime
}

func ToStringValueFromString(s *string) *wrapperspb.StringValue {
	if s == nil {
		return nil
	}
	return &wrapperspb.StringValue{Value: *s}
}
func ToInt32ValueFromInt32(num *int32) *wrapperspb.Int32Value {
	if num == nil {
		return nil
	}
	return &wrapperspb.Int32Value{Value: *num}
}

func ToStringFromStringValue(s *wrapperspb.StringValue) *string {
	if s == nil {
		return nil
	}
	return &s.Value
}
func ToInt32FromInt32Value(num *wrapperspb.Int32Value) *int32 {
	if num == nil {
		return nil
	}
	return &num.Value
}

func ToInt64FromInt64Value(num *wrapperspb.Int64Value) *int64 {
	if num == nil {
		return nil
	}
	return &num.Value
}
func ToFloatValueFromFloat64(num *float64) *wrapperspb.FloatValue {
	if num == nil {
		return nil
	}
	return &wrapperspb.FloatValue{
		Value: float32(*num),
	}
}
