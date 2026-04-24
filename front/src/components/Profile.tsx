import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { getInterestLabel } from '../constants/interests';
import './Profile.css';

interface UserProfile {
  id: number;
  name: string;
  country?: string;
  city?: string;
  language?: string;
  interests?: string[];
  collections?: string[];
}

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
  const { user, setUser, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchProfile = async () => {
      // Prevent multiple fetches
      if (hasFetchedRef.current) {
        return;
      }
      
      // Authorization check is handled by router, so we can directly fetch profile
      try {
        setIsLoading(true);
        setError(null);
        
        // Set access token if we have it
        if (token) {
          authService.setAccessToken(token);
        }
        
        hasFetchedRef.current = true;
        const userData = await authService.getCurrentUser();
        setProfile(userData as UserProfile);
        
        // Update user in AuthContext only if data changed
        if (userData) {
          const newUserData = {
            id: userData.id,
            name: userData.name,
            country: userData.country,
            city: userData.city,
          };
          
          // Only update if data actually changed
          if (
            !user ||
            user.id !== newUserData.id ||
            user.name !== newUserData.name ||
            user.country !== newUserData.country ||
            user.city !== newUserData.city
          ) {
            setUser(newUserData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setError('Не удалось загрузить данные профиля');
        hasFetchedRef.current = false; // Allow retry on error
      } finally {
        setIsLoading(false);
        setAccessChecked(true);
      }
    };

    // Only fetch if we have user id
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id, token]); // Removed setUser from dependencies

  if (isLoading || !accessChecked) {
    return (
      <div className="profile-container">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">{error}</div>
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

