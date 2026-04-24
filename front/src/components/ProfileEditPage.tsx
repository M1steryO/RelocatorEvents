import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showGlobalNotification } from '../contexts/NotificationContext';
import './ProfileEditPage.css';

export const ProfileEditPage = () => {
    const navigate = useNavigate();
    const { user, setUser, logout, isLoading } = useAuth();

    const initialName = user?.name || '';
    const initialEmail = user?.email || '';
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);

    useEffect(() => {
        setName(initialName);
        setEmail(initialEmail);
    }, [initialName, initialEmail]);

    if (isLoading) {
        return (
            <div className="profile-edit-container">
                <div className="loading-spinner"></div>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-edit-container">
                <p>Профиль не найден</p>
            </div>
        );
    }

    const handleSave = () => {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName) {
            showGlobalNotification('Введите имя', 'error');
            return;
        }

        setUser({
            ...user,
            name: trimmedName,
            email: trimmedEmail || undefined,
        });
        showGlobalNotification('Изменения сохранены', 'success');
        navigate('/profile');
    };

    const handleReset = () => {
        setName(initialName);
        setEmail(initialEmail);
    };

    const handleLogout = () => {
        logout();
        navigate('/register', { replace: true });
    };

    return (
        <div className="profile-edit-container">
            <header className="profile-edit-header">
                <button type="button" className="profile-edit-back" onClick={() => navigate('/profile')} aria-label="Назад">
                    <svg width="8" height="16" viewBox="0 0 11 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M10.5195 22.6368C11.1105 22.1093 11.1636 21.2007 10.6382 20.6074L3.36949 12.3985C3.1151 12.1112 2.97984 11.9569 2.89061 11.8386C2.8875 11.8345 2.88456 11.8306 2.88178 11.8268C2.88443 11.8229 2.88723 11.8189 2.89019 11.8147C2.97519 11.6933 3.10492 11.5343 3.34901 11.2381L10.6713 2.35397C11.1754 1.74231 11.0902 0.836171 10.481 0.330039C9.87174 -0.176091 8.9692 -0.0905485 8.46508 0.521104L1.11575 9.43811C0.909417 9.68839 0.705494 9.93574 0.54769 10.1611C0.372178 10.4117 0.190088 10.7212 0.0902292 11.1111C-0.0386452 11.6143 -0.0293129 12.1431 0.117234 12.6413C0.230786 13.0274 0.423683 13.3303 0.607927 13.5745C0.773579 13.7941 0.986095 14.034 1.20112 14.2768C1.21052 14.2874 1.21994 14.298 1.22935 14.3087L8.49811 22.5176C9.02349 23.1109 9.92849 23.1643 10.5195 22.6368Z" fill="#414141" />
                    </svg>
                </button>
                <h1 className="profile-edit-title">Редактирование профиля</h1>
            </header>

            <div className="profile-edit-avatar-wrap">
                <div className="profile-edit-avatar">
                    {(user.name || 'П').trim().charAt(0).toUpperCase()}
                </div>
                <button type="button" className="profile-edit-avatar-button" aria-label="Изменить аватар">
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                        <path d="M14.5266 1.73889C15.6237 0.641789 17.4023 0.641789 18.4994 1.73889C19.5965 2.83599 19.5965 4.61456 18.4994 5.71166L8.98966 15.2214C8.46275 15.7483 7.74816 16.0443 7.0033 16.0443H4.9884V14.0294C4.9884 13.2845 5.28429 12.57 5.8112 12.0431L14.5266 3.32768L14.8723 2.982L14.5266 1.73889Z" fill="#FAF9F6" />
                    </svg>
                </button>
            </div>

            <div className="profile-edit-form">
                <div className="profile-edit-field">
                    <div className="profile-edit-label-row">
                        <label htmlFor="profile-name">Имя</label>
                        <span>Изменить</span>
                    </div>
                    <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Введите имя"
                    />
                </div>

                <div className="profile-edit-field">
                    <div className="profile-edit-label-row">
                        <label htmlFor="profile-email">Почта</label>
                        <span>Изменить</span>
                    </div>
                    <input
                        id="profile-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Введите почту"
                    />
                </div>
            </div>

            <button type="button" className="profile-edit-save" onClick={handleSave}>
                Сохранить
            </button>

            <div className="profile-edit-footer">
                <button type="button" className="profile-edit-secondary" onClick={handleReset}>
                    Сбросить настройки
                </button>
                <button type="button" className="profile-edit-logout" onClick={handleLogout}>
                    Выйти
                </button>
            </div>
        </div>
    );
};

