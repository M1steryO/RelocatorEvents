import { useAuth } from '../contexts/AuthContext';
import { getInterestLabel } from '../constants/interests';
import './Profile.css';

const getLanguageLabel = (language?: string): string => {
  switch ((language || '').toLowerCase()) {
    case 'ru':
      return 'Русский';
    case 'en':
      return 'Английский';
    case 'ge':
      return 'Грузинский';
    default:
      return language || '';
  }
};

export const Profile = () => {
  const { user: profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <p>Профиль не найден</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-hero">
        <div className="profile-avatar">
          {(profile.name || 'П')
            .trim()
            .charAt(0)
            .toUpperCase()}
        </div>
        <h1 className="profile-name">{profile.name}</h1>
      </div>

      <div className="profile-content">
        {profile.city && (
          <div className="profile-section">
            <h2 className="profile-section-title">Город</h2>
            <div className="profile-tags">
              <span className="profile-tag">{profile.city}</span>
            </div>
          </div>
        )}

        {profile.country && (
          <div className="profile-section">
            <h2 className="profile-section-title">Страна</h2>
            <div className="profile-tags">
              <span className="profile-tag">{profile.country}</span>
            </div>
          </div>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <div className="profile-section">
            <h2 className="profile-section-title">Интересы</h2>
            <div className="profile-tags">
              {profile.interests.map((interestCode, index) => (
                <span key={index} className="profile-tag">
                  {getInterestLabel(interestCode)}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.language && (
          <div className="profile-section">
            <h2 className="profile-section-title">Язык</h2>
            <div className="profile-tags">
              <span className="profile-tag">{getLanguageLabel(profile.language)}</span>
            </div>
          </div>
        )}

        {(!profile.interests || profile.interests.length === 0) && !profile.city && !profile.country && !profile.language && (
          <div className="profile-empty-state">
            Заполните профиль, чтобы персонализировать рекомендации
          </div>
        )}
      </div>
    </div>
  );
};

