package storage

const (
	RoleUser = iota
	RoleAdmin
)

var roleToStr = map[int]string{
	RoleUser:  "USER",
	RoleAdmin: "ADMIN",
}

var strToRole = map[string]int{
	"USER":  RoleUser,
	"ADMIN": RoleAdmin,
}

func GetRoleById(id int) string {
	return roleToStr[id]
}

func GetRoleIdByStr(str string) int {
	return strToRole[str]
}
