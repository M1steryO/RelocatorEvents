package jwt

import (
	"errors"
	"fmt"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/model/auth"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type UserClaims struct {
	jwt.RegisteredClaims
	Id   int64  `json:"id"`
	Role string `json:"role"`
}

var (
	ErrTokenExpired = errors.New("token expired")
	ErrTokenInvalid = errors.New("token invalid")
)

func GenerateToken(user auth.UserInfo, secretKey []byte, duration time.Duration) (string, error) {
	now := time.Now()

	claims := UserClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(duration)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now), // можно убрать, если не нужно
		},
		Id:   user.Id,
		Role: user.Role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &claims)
	return token.SignedString(secretKey)
}

func VerifyToken(tokenStr string, secretKey []byte) (*UserClaims, error) {
	claims := &UserClaims{}

	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected token signing method: %v", token.Header["alg"])
		}
		return secretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return claims, ErrTokenExpired
		}
		return nil, fmt.Errorf("%w: %v", ErrTokenInvalid, err)
	}

	if token == nil || !token.Valid {
		return nil, ErrTokenInvalid
	}

	return claims, nil
}
