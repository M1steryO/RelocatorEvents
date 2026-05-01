import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showGlobalNotification } from '../contexts/NotificationContext';
import { authService } from '../services/authService';
import { reviewsService } from '../services/reviewsService';
import { MEDIA_BASE_URL } from '../config';
import './ProfileEditPage.css';

export const ProfileEditPage = () => {
    const MODAL_ANIMATION_MS = 220;
    const navigate = useNavigate();
    const { user, setUser, logout, isLoading } = useAuth();
    const [activeModal, setActiveModal] = useState<'save' | 'logout' | 'reset' | null>(null);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const closeModalTimerRef = useRef<number | null>(null);

    const initialName = user?.name || '';
    const initialEmail = user?.email || '';
    const initialAvatarUrl = user?.avatar_url || '';
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
    const [isAvatarUploading, setIsAvatarUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setName(initialName);
        setEmail(initialEmail);
        setAvatarUrl(initialAvatarUrl);
    }, [initialName, initialEmail, initialAvatarUrl]);

    useEffect(() => {
        return () => {
            if (avatarPreviewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreviewUrl);
            }
        };
    }, [avatarPreviewUrl]);

    useEffect(() => {
        return () => {
            if (closeModalTimerRef.current) {
                window.clearTimeout(closeModalTimerRef.current);
            }
        };
    }, []);

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

    const resolveAvatarUrl = (objectKey: string): string => {
        if (/^https?:\/\//i.test(objectKey)) {
            return objectKey;
        }
        const normalizedBase = MEDIA_BASE_URL.replace(/\/$/, '');
        const normalizedKey = objectKey.replace(/^\//, '');
        return `${normalizedBase}/${normalizedKey}`;
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !user) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            showGlobalNotification('Выберите изображение', 'error');
            return;
        }

        const previousPreview = avatarPreviewUrl;
        const localPreview = URL.createObjectURL(file);
        setAvatarPreviewUrl(localPreview);
        setIsAvatarUploading(true);
        try {
            const objectName = `${Date.now()}-${file.name}`;
            const presigned = await reviewsService.getReviewPresignedUrl(objectName, 0);
            const uploadResponse = await fetch(presigned.presigned_url, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type || 'application/octet-stream',
                },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.status}`);
            }

            const uploadedAvatarUrl = resolveAvatarUrl(presigned.object_key);
            setAvatarUrl(uploadedAvatarUrl);
            showGlobalNotification('Фото профиля загружено', 'success');
            if (previousPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(previousPreview);
            }
        } catch (error) {
            if (localPreview.startsWith('blob:')) {
                URL.revokeObjectURL(localPreview);
            }
            setAvatarPreviewUrl(previousPreview);
            console.error('Failed to upload avatar:', error);
            showGlobalNotification('Не удалось загрузить фото профиля', 'error');
        } finally {
            setIsAvatarUploading(false);
        }
    };

    const handleSave = async () => {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName) {
            showGlobalNotification('Введите имя', 'error');
            return;
        }

        if (isAvatarUploading) {
            showGlobalNotification('Дождитесь завершения загрузки фото', 'error');
            return;
        }

        const payload: { name?: string; email?: string; avatar_url?: string } = {};
        if (trimmedName !== initialName) payload.name = trimmedName;
        if (trimmedEmail !== initialEmail) payload.email = trimmedEmail;
        if (avatarUrl !== initialAvatarUrl) payload.avatar_url = avatarUrl;

        if (!payload.name && !payload.email && !payload.avatar_url) {
            showGlobalNotification('Нет изменений для сохранения', 'success');
            navigate('/profile');
            return;
        }

        setIsSaving(true);
        try {
            await authService.updateUser(user.id, payload);
            setUser({
                ...user,
                name: payload.name ?? user.name,
                email: payload.email ?? user.email,
                avatar_url: payload.avatar_url ?? user.avatar_url,
            });
            showGlobalNotification('Изменения сохранены', 'success');
            navigate('/profile');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось сохранить изменения';
            showGlobalNotification(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setName(initialName);
        setEmail(initialEmail);
        setAvatarUrl(initialAvatarUrl);
        if (avatarPreviewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreviewUrl);
        }
        setAvatarPreviewUrl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/register', { replace: true });
    };

    const openModal = (modal: 'save' | 'logout' | 'reset') => {
        if (closeModalTimerRef.current) {
            window.clearTimeout(closeModalTimerRef.current);
            closeModalTimerRef.current = null;
        }
        setIsModalClosing(false);
        setActiveModal(modal);
    };

    const closeModal = (afterClose?: () => void) => {
        if (!activeModal) {
            afterClose?.();
            return;
        }
        if (isModalClosing) {
            return;
        }
        setIsModalClosing(true);
        if (closeModalTimerRef.current) {
            window.clearTimeout(closeModalTimerRef.current);
        }
        closeModalTimerRef.current = window.setTimeout(() => {
            setActiveModal(null);
            setIsModalClosing(false);
            closeModalTimerRef.current = null;
            afterClose?.();
        }, MODAL_ANIMATION_MS);
    };

    const handleModalClose = () => {
        closeModal();
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
                    {avatarPreviewUrl || avatarUrl ? (
                        <img
                            src={avatarPreviewUrl || avatarUrl}
                            alt="Аватар профиля"
                            className="profile-edit-avatar-image"
                        />
                    ) : (
                        (user.name || 'П').trim().charAt(0).toUpperCase()
                    )}
                </div>
                <button
                    type="button"
                    className="profile-edit-avatar-button"
                    aria-label="Изменить аватар"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAvatarUploading || isSaving}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect width="17.1523" height="17.1523" fill="url(#pattern0_1666_6774)" />
                        <defs>
                            <pattern id="pattern0_1666_6774" patternContentUnits="objectBoundingBox" width="1" height="1">
                                <use xlinkHref="#image0_1666_6774" transform="scale(0.00390625)" />
                            </pattern>
                            <image id="image0_1666_6774" width="256" height="256" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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" />
                        </defs>
                    </svg>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="profile-edit-avatar-input"
                    onChange={handleAvatarChange}
                />
            </div>
            {isAvatarUploading && <p className="profile-edit-avatar-status">Загружаем фото...</p>}

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

            <button
                type="button"
                className="profile-edit-save"
                onClick={() => openModal('save')}
                disabled={isAvatarUploading || isSaving}
            >
                Сохранить
            </button>

            <div className="profile-edit-footer">
                <button type="button" className="profile-edit-secondary" onClick={() => openModal('reset')}>
                    Сбросить настройки
                </button>
                <button type="button" className="profile-edit-logout" onClick={() => openModal('logout')}>
                    Выйти
                </button>
            </div>

            {activeModal && (
                <div className={`profile-edit-modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={handleModalClose}>
                    <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="profile-edit-modal-close"
                            onClick={handleModalClose}
                            aria-label="Закрыть"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
                                <circle cx="17" cy="17" r="17" fill="#414141" />
                                <path d="M11 11L23 23M23 11L11 23" stroke="#FAF9F6" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>

                        {activeModal === 'save' && (
                            <>
                                <p className="profile-edit-modal-title">Вы действительно хотите сохранить изменения профиля?</p>
                                <div className="profile-edit-modal-actions">
                                    <button type="button" className="profile-edit-modal-btn profile-edit-modal-btn-outline" onClick={handleModalClose}>
                                        Не сохранить
                                    </button>
                                    <button
                                        type="button"
                                        className="profile-edit-modal-btn profile-edit-modal-btn-filled"
                                        onClick={() => closeModal(() => { void handleSave(); })}
                                    >
                                        Сохранить
                                    </button>
                                </div>
                            </>
                        )}

                        {activeModal === 'logout' && (
                            <>
                                <p className="profile-edit-modal-title">Вы действительно хотите выйти из аккаунта?</p>
                                <div className="profile-edit-modal-actions">
                                    <button
                                        type="button"
                                        className="profile-edit-modal-btn profile-edit-modal-btn-outline"
                                        onClick={() => closeModal(handleLogout)}
                                    >
                                        Выйти
                                    </button>
                                    <button type="button" className="profile-edit-modal-btn profile-edit-modal-btn-filled" onClick={handleModalClose}>
                                        Не выходить
                                    </button>
                                </div>
                            </>
                        )}

                        {activeModal === 'reset' && (
                            <>
                                <p className="profile-edit-modal-title">Вы действительно хотите сбросить настройки профиля?</p>
                                <p className="profile-edit-modal-subtitle">Аккаунт сбросится и вам придется снова проходить регистрацию</p>
                                <div className="profile-edit-modal-actions">
                                    <button
                                        type="button"
                                        className="profile-edit-modal-btn profile-edit-modal-btn-outline"
                                        onClick={() => closeModal(handleReset)}
                                    >
                                        Сбросить
                                    </button>
                                    <button type="button" className="profile-edit-modal-btn profile-edit-modal-btn-filled" onClick={handleModalClose}>
                                        Не сбрасывать
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

