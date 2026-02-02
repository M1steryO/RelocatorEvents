package auth

type UserInfo struct {
	Id   int64  `json:"id"`
	Role string `json:"role"`
}
