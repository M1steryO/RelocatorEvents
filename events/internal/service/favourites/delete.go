package favourites

import "context"

func (s *serv) Delete(ctx context.Context, eventId, userId int64) error {

	err := s.db.Delete(ctx, eventId, userId)

	if err != nil {
		return err
	}
	return nil
}
