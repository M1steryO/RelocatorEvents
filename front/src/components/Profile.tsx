import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
        <button
          type="button"
          className="profile-edit-link"
          onClick={() => navigate('/profile/edit')}
        >
          Редактировать
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
            <path d="M14.5266 1.73889C15.6237 0.641789 17.4023 0.641789 18.4994 1.73889C19.5965 2.83599 19.5965 4.61456 18.4994 5.71166L8.98966 15.2214C8.46275 15.7483 7.74816 16.0443 7.0033 16.0443H4.9884V14.0294C4.9884 13.2845 5.28429 12.57 5.8112 12.0431L14.5266 3.32768L14.8723 2.982L14.5266 1.73889Z" fill="#458DBD" />
          </svg>
        </button>
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

