package auth

import (
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/access_v1"
	"golang.org/x/net/context"
)

func (c *authServiceClient) Check(ctx context.Context) error {
	_, err := c.client.Check(ctx, &desc.CheckRequest{})
	if err != nil {
		return err
	}
	return nil
}
