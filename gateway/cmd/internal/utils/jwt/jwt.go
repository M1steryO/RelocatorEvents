package jwt

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/model/auth"
	"github.com/dgrijalva/jwt-go"
	"github.com/pkg/errors"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"time"
)

func GenerateToken(info auth.UserInfo, secretKey []byte, duration time.Duration) (string, error) {
	claims := auth.UserClaims{
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(duration).Unix(),
		},
		Id:   info.Id,
		Role: info.Role,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString(secretKey)
}

func VerifyToken(tokenStr string, secretKey []byte) (*auth.UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr,
		&auth.UserClaims{},
		func(token *jwt.Token) (interface{}, error) {
			_, ok := token.Method.(*jwt.SigningMethodHMAC)
			if !ok {
				return nil, errors.Errorf("unexpected token signing method")
			}
			return secretKey, nil
		})
	if err != nil {
		return nil, errors.Errorf("invalid token: %s", err.Error())
	}

	claims, ok := token.Claims.(*auth.UserClaims)
	if !ok {
		return nil, errors.Errorf("invalid token claims")
	}
	return claims, nil

}

func RefreshAccessToken(refreshToken, refreshTokenSecretKey, accessTokenSecretKey string, accessTokenExpiration time.Duration) (string, error) {
	claims, err := VerifyToken(
		refreshToken,
		[]byte(refreshTokenSecretKey),
	)
	if err != nil {
		return "", status.Errorf(codes.Aborted, "invalid refresh token")
	}
	accessToken, err := GenerateToken(auth.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, []byte(accessTokenSecretKey), accessTokenExpiration)
	if err != nil {
		return "", err
	}
	return accessToken, nil
}

func RefreshRefreshToken(oldRefreshToken, refreshTokenSecretKey string, refreshTokenExpiration time.Duration) (string, error) {
	claims, err := VerifyToken(
		oldRefreshToken,
		[]byte(refreshTokenSecretKey),
	)
	if err != nil {
		return "", status.Errorf(codes.Aborted, "invalid refresh token")
	}
	newRefreshToken, err := GenerateToken(auth.UserInfo{
		Id:   claims.Id,
		Role: claims.Role,
	}, []byte(oldRefreshToken), refreshTokenExpiration)
	if err != nil {
		return "", err
	}
	return newRefreshToken, nil
}
