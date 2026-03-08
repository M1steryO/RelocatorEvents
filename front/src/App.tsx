// src/App.tsx
import {useEffect, useState} from "react";
import {Routes, Route, Navigate, useNavigate} from "react-router-dom";
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
import {subscribeToServiceUnavailable} from "./utils/serviceUnavailable";
import {subscribeToUnauthorized} from "./utils/unauthorized";
import "./App.css";

function App() {
    const {user, isAuthenticated, isLoading, logout} = useAuth();
    const [isInitializing, setIsInitializing] = useState(true);
    const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
    const navigate = useNavigate();

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
            navigate('/register', { replace: true });
        });
    }, [logout, navigate]);

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
                                <Navigate to="/" replace />
                            ) : (
                                <RegistrationForm />
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
                                <Navigate to="/register" replace />
                            )
                        }
                    />
                    <Route 
                        path="/" 
                        element={
                            <>
                                <HomePage />
                                <BottomNavigation />
                            </>
                        } 
                    />
                    <Route 
                        path="/favourites" 
                        element={
                            <>
                                <FavouritesPage />
                                <BottomNavigation />
                            </>
                        } 
                    />
                    <Route 
                        path="/events/:id" 
                        element={
                            <>
                                <EventDetailPage />
                                <BottomNavigation />
                            </>
                        } 
                    />
                    <Route 
                        path="/events/:id/reviews" 
                        element={<EventReviewsPage />} 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
        </>
    );

    return (
        <Routes>
            <Route 
                path="/register" 
                element={
                    isAuthenticated ? (
                        <Navigate to="/" replace />
                    ) : (
                        <RegistrationForm />
                    )
                } 
            />
            <Route 
                path="/profile" 
                element={
                    isAuthenticated ? (
                        <Profile />
                    ) : (
                        <Navigate to="/register" replace />
                    )
                }
            />
            <Route 
                path="/" 
                element={
                    isAuthenticated ? (
                        <div className="app-container">
                            <div className="app-header">
                                <h2>Привет, {user?.name} 👋</h2>
                                <p>Добро пожаловать в события для релокантов.</p>
                            </div>
                            {/* Тут дальше рендерим основной UI */}
                        </div>
                    ) : (
                        <Navigate to="/register" replace />
                    )
                } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
