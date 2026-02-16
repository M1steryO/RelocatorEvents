import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoadingScreen.css';

interface LoadingScreenProps {
    isLoading: boolean;
    minimumDisplayTime?: number; // в миллисекундах, по умолчанию 3000
}

export const LoadingScreen = ({ isLoading, minimumDisplayTime = 3000 }: LoadingScreenProps) => {
    const { user, isAuthenticated } = useAuth();
    const [showLoading, setShowLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [showWelcomeText, setShowWelcomeText] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [shouldAnimateWelcome, setShouldAnimateWelcome] = useState(false);
    const startTimeRef = useRef<number>(Date.now());
    const timeoutRef = useRef<number | null>(null);
    const fadeOutTimeoutRef = useRef<number | null>(null);
    const welcomeTextTimeoutRef = useRef<number | null>(null);
    const fadeInTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        // Если пользователь не авторизован, сбрасываем состояние приветственного текста
        if (!isAuthenticated || !user) {
            setShowWelcomeText(false);
            setIsFadingOut(false);
            setShouldAnimateWelcome(false);
            if (welcomeTextTimeoutRef.current) {
                clearTimeout(welcomeTextTimeoutRef.current);
                welcomeTextTimeoutRef.current = null;
            }
            if (fadeInTimeoutRef.current) {
                clearTimeout(fadeInTimeoutRef.current);
                fadeInTimeoutRef.current = null;
            }
            return;
        }

        // Показываем текст приветствия через секунду после показа загрузочного экрана
        // Только если пользователь авторизован
        if (showLoading && !showWelcomeText && !isClosing && !isFadingOut && isAuthenticated && user) {
            if (welcomeTextTimeoutRef.current) {
                clearTimeout(welcomeTextTimeoutRef.current);
            }
            welcomeTextTimeoutRef.current = setTimeout(() => {
                // Сначала запускаем fade out старого контента и одновременно показываем новый
                setIsFadingOut(true);
                setShowWelcomeText(true);
                // Используем requestAnimationFrame для плавной анимации появления нового контента
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setShouldAnimateWelcome(true);
                    });
                });
                // После завершения fade out убираем старый контент
                if (fadeInTimeoutRef.current) {
                    clearTimeout(fadeInTimeoutRef.current);
                }
                fadeInTimeoutRef.current = setTimeout(() => {
                    setIsFadingOut(false);
                }, 300); // Время fade out анимации
            }, 1000);
        }

        return () => {
            if (welcomeTextTimeoutRef.current) {
                clearTimeout(welcomeTextTimeoutRef.current);
            }
            if (fadeInTimeoutRef.current) {
                clearTimeout(fadeInTimeoutRef.current);
            }
        };
    }, [showLoading, showWelcomeText, isClosing, isAuthenticated, user, isFadingOut]);

    useEffect(() => {
        // Если загрузка завершилась
        if (!isLoading) {
            const elapsedTime = Date.now() - startTimeRef.current;
            const remainingTime = minimumDisplayTime - elapsedTime;

            if (remainingTime <= 0) {
                // Минимальное время уже прошло, начинаем плавное закрытие
                setIsClosing(true);
                // Ждем завершения анимации перед полным скрытием
                if (fadeOutTimeoutRef.current) {
                    clearTimeout(fadeOutTimeoutRef.current);
                }
                fadeOutTimeoutRef.current = setTimeout(() => {
                    setShowLoading(false);
                }, 300); // Время анимации fade out
            } else {
                // Ждем оставшееся время до минимального времени отображения
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    setIsClosing(true);
                    // Ждем завершения анимации перед полным скрытием
                    if (fadeOutTimeoutRef.current) {
                        clearTimeout(fadeOutTimeoutRef.current);
                    }
                    fadeOutTimeoutRef.current = setTimeout(() => {
                        setShowLoading(false);
                    }, 300); // Время анимации fade out
                }, remainingTime);
            }
        } else {
            // Если загрузка еще идет, сбрасываем таймеры
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (fadeOutTimeoutRef.current) {
                clearTimeout(fadeOutTimeoutRef.current);
                fadeOutTimeoutRef.current = null;
            }
            setShowLoading(true);
            setIsClosing(false);
            setShowWelcomeText(false);
            setIsFadingOut(false);
            setShouldAnimateWelcome(false);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (fadeOutTimeoutRef.current) {
                clearTimeout(fadeOutTimeoutRef.current);
            }
        };
    }, [isLoading, minimumDisplayTime]);

    if (!showLoading) {
        return null;
    }

    const shouldShowInitial = !showWelcomeText || isFadingOut;
    const shouldShowWelcome = showWelcomeText && isAuthenticated && user;

    return (
        <div className={`loading-screen ${isClosing ? 'loading-screen-closing' : ''}`}>
            <div className="loading-screen-content">
                {shouldShowInitial ? (
                    <div className={`loading-initial-container ${isFadingOut ? 'fade-out' : ''}`}>
                <img 
                    src="/loading-page-countries-2.png" 
                            alt="EVENTIFY" 
                    className="loading-logo"
                    onError={(e) => {
                        // Fallback если изображение не найдено
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                <p className="loading-title">Быстрый поиск<br />мероприятий с</p>
                <img 
                    src="/eventify-logo.png" 
                    alt="EVENTIFY" 
                    className="loading-logo"
                    onError={(e) => {
                        // Fallback если изображение не найдено
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                <img 
                    src="/loading-page-countries-1.png" 
                    alt="EVENTIFY" 
                    className="loading-logo"
                    onError={(e) => {
                        // Fallback если изображение не найдено
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                    </div>
                ) : null}
                {shouldShowWelcome ? (
                    <div className={`loading-welcome-container ${shouldAnimateWelcome ? 'fade-in' : ''}`}>
                        <p className="loading-welcome">
                            Добро пожаловать<br />
                            в Eventify,<br />
                            {user.name}
                        </p>
                        <img 
                            src="/loading-page-countries-1.png" 
                            alt="EVENTIFY" 
                            className="loading-logo"
                            onError={(e) => {
                                // Fallback если изображение не найдено
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

