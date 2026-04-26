// src/App.tsx
import { useEffect, useState, useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {useAuth} from "./contexts/AuthContext";
import {RegistrationForm} from "./components/RegistrationForm";
import {Profile} from "./components/Profile";
import {LoadingScreen} from "./components/LoadingScreen";
import {HomePage} from "./components/HomePage";
import {EventDetailPage} from "./components/EventDetailPage";
import {EventReviewsPage} from "./components/EventReviewsPage";
import {FavouritesPage} from "./components/FavouritesPage";
import {BottomNavigation} from "./components/BottomNavigation";
import {ServiceUnavailablePage} from "./components/ServiceUnavailablePage";
import {LoginPage} from "./components/LoginPage";
import {ProfileEditPage} from "./components/ProfileEditPage";
import {sanitizeInternalPath} from "./utils/navigation";
import {subscribeToServiceUnavailable} from "./utils/serviceUnavailable";
import {subscribeToUnauthorized} from "./utils/unauthorized";
import "./App.css";

function App() {
    const { isAuthenticated, isLoading, logout } = useAuth();
    const [isInitializing, setIsInitializing] = useState(true);
    const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    const redirectState = { redirectTo };
    const authRedirectTarget =
        sanitizeInternalPath((location.state as { redirectTo?: unknown } | null)?.redirectTo) || '/';

    // После перехода (в т.ч. назад с карточки мероприятия): снять блокировку скролла и «залипшую» подложку из index.html.
    useLayoutEffect(() => {
        document.body.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('overflow');
        document.getElementById('app-loading-cover')?.remove();
    }, [location.pathname]);

    // При полной перезагрузке страницы сбрасываем сохранённую ленту — восстанавливаем только при возврате со страницы мероприятия (SPA-переход).
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('homeFeedState');
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            const tg = window.Telegram?.WebApp;
            if (tg) {
                tg.ready();
                tg.expand();
            }

            setIsInitializing(false);
        };

        if (!isLoading) {
            initialize();
        }
    }, [isLoading]);

    useEffect(() => {
        return subscribeToServiceUnavailable(() => {
            setIsServiceUnavailable(true);
        });
    }, []);

    useEffect(() => {
        return subscribeToUnauthorized(() => {
            logout();
            navigate('/register', { replace: true, state: { redirectTo } });
        });
    }, [logout, navigate, redirectTo]);

    if (isServiceUnavailable) {
        return <ServiceUnavailablePage />;
    }

    // LoadingScreen — первый экран; контент не рендерим пока идёт загрузка
    const isAppLoading = isLoading || isInitializing;

    useEffect(() => {
        if (!isAppLoading) {
            document.getElementById('app-loading-cover')?.remove();
        }
    }, [isAppLoading]);

    return (
        <>





            <LoadingScreen isLoading={isAppLoading} minimumDisplayTime={2000} />
            {!isAppLoading && (
                <Routes>
                    <Route 
                        path="/register" 
                        element={
                            isAuthenticated ? (
                                <Navigate to={authRedirectTarget} replace />
                            ) : (
                                <RegistrationForm />
                            )
                        } 
                    />
                    <Route
                        path="/login"
                        element={
                            isAuthenticated ? (
                                <Navigate to={authRedirectTarget} replace />
                            ) : (
                                <LoginPage />
                            )
                        }
                    />
                    <Route 
                        path="/profile" 
                        element={
                            isAuthenticated ? (
                                <>
                                    <Profile />
                                    <BottomNavigation />
                                </>
                            ) : (
                                <Navigate to="/register" replace state={redirectState} />
                            )
                        }
                    />
                    <Route
                        path="/profile/edit"
                        element={
                            isAuthenticated ? (
                                <ProfileEditPage />
                            ) : (
                                <Navigate to="/register" replace state={redirectState} />
                            )
                        }
                    />
                    <Route 
                        path="/" 
                        element={
                            isAuthenticated ? (
                                <>
                                    <HomePage />
                                    <BottomNavigation />
                                </>
                            ) : (
                                <Navigate to="/register" replace state={redirectState} />
                            )
                        } 
                    />
                    <Route 
                        path="/favourites" 
                        element={
                            isAuthenticated ? (
                                <>
                                    <FavouritesPage />
                                    <BottomNavigation />
                                </>
                            ) : (
                                <Navigate to="/register" replace state={redirectState} />
                            )
                        } 
                    />
                    <Route 
                        path="/events/:id" 
                        element={
                            isAuthenticated ? (
                                <>
                                    <EventDetailPage />
                                    <BottomNavigation />
                                </>
                            ) : (
                                <Navigate to="/register" replace state={redirectState} />
                            )
                        } 
                    />
                    <Route 
                        path="/events/:id/reviews" 
                        element={isAuthenticated ? <EventReviewsPage /> : <Navigate to="/register" replace state={redirectState} />} 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
        </>
    );

    
}

export default App;
