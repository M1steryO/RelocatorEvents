package user

import "context"

func (s *serv) Delete(ctx context.Context, userId int64) error {
	err := s.db.Delete(ctx, userId)
	return err
}
