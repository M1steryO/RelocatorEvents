import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoadingScreen.css';

interface LoadingScreenProps {
    isLoading: boolean;
    minimumDisplayTime?: number; // в миллисекундах, по умолчанию 3000
}

export const LoadingScreen = ({ isLoading, minimumDisplayTime = 3000 }: LoadingScreenProps) => {
    const { user } = useAuth();
    const [showLoading, setShowLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [showWelcomeText, setShowWelcomeText] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [shouldAnimateWelcome, setShouldAnimateWelcome] = useState(false);
    const welcomeShownRef = useRef(false);
    const part2ShownAtRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const timeoutRef = useRef<number | null>(null);
    const fadeOutTimeoutRef = useRef<number | null>(null);
    const fadeInTimeoutRef = useRef<number | null>(null);

    // Показываем приветствие только когда пользователь уже загружен в AuthProvider.
    useEffect(() => {
        if (!showLoading || showWelcomeText || isClosing || welcomeShownRef.current || !user?.name) return;

        welcomeShownRef.current = true;
        part2ShownAtRef.current = Date.now();
        setIsFadingOut(true);
        setShowWelcomeText(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setShouldAnimateWelcome(true));
        });
        if (fadeInTimeoutRef.current) clearTimeout(fadeInTimeoutRef.current);
        fadeInTimeoutRef.current = window.setTimeout(() => setIsFadingOut(false), 300);
    }, [showLoading, showWelcomeText, isClosing, user?.name]);

    useEffect(() => {
        return () => {
            if (fadeInTimeoutRef.current) clearTimeout(fadeInTimeoutRef.current);
        };
    }, []);

    const startClosing = useCallback(() => {
        if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsClosing(true);
        fadeOutTimeoutRef.current = setTimeout(() => {
            setShowLoading(false);
        }, 300);
    }, []);

    const PART2_DISPLAY_MS = 2000; // вторая часть (приветствие) показывается минимум 2 секунды

    // Таймаут = минимум времени показа + минимум 2 с для второй части. Закрываем только когда загрузка завершена и прошло нужное время.
    useEffect(() => {
        if (!isLoading) {
            // Если пользователь уже известен, сначала обязательно переключаемся
            // на приветствие (part 2), и только потом считаем таймер закрытия.
            if (user?.name && !showWelcomeText && !welcomeShownRef.current) {
                return;
            }

            const elapsed = Date.now() - startTimeRef.current;
            let remaining = Math.max(0, minimumDisplayTime - elapsed);
            if (part2ShownAtRef.current != null) {
                const part2Elapsed = Date.now() - part2ShownAtRef.current;
                remaining = Math.max(remaining, PART2_DISPLAY_MS - part2Elapsed);
            }
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(startClosing, Math.max(0, remaining));
            return () => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
        }
        setShowLoading(true);
        setIsClosing(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [isLoading, minimumDisplayTime, startClosing, showWelcomeText, user?.name]);

    if (!showLoading) {
        return null;
    }

    // Часть 1 первой; часть 2 — только если пользователь уже есть в AuthProvider
    const shouldShowInitial = !showWelcomeText || isFadingOut;
    const shouldShowWelcome = showWelcomeText;
    const displayName = user?.name ?? '';

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
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                <p className="loading-title">Быстрый поиск<br />мероприятий с</p>
                <img 
                    src="/eventify-logo.svg" 
                    alt="EVENTIFY" 
                    className="loading-logo"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                <img 
                    src="/loading-page-countries-1.png" 
                    alt="EVENTIFY" 
                    className="loading-logo"
                    onError={(e) => {
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
                            <span className="loading-welcome-name">{displayName || '...'}</span>
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

