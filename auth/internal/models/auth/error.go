package auth


type CredentialsError struct {
	msg string
}

func (e *CredentialsError) Error() string {
	return e.msg
}
func NewCredentialsError(msg string) *CredentialsError {
	return &CredentialsError{msg: msg}
}
