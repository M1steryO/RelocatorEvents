package domain

import "io"

type UploadInput struct {
	File        io.Reader
	Name        string
	Size        int64
	ContentType string
}

type PresignedOutput struct {
	ObjectKey string
	Url       string
}
