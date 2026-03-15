package auth

import "github.com/dgrijalva/jwt-go"

type UserClaims struct {
	jwt.StandardClaims
	Id   int64  `json:"id"`
	Role string `json:"role"`
}
