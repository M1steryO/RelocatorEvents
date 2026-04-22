import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { getTelegramInitData } from '../utils/telegramInitData';
import './RegistrationForm.css';
import './LoginPage.css';

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const getFriendlyLoginError = (error: unknown): string => {
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

    if (
        message.includes('invalid credentials') ||
        message.includes('invalid login') ||
        message.includes('invalid password') ||
        message.includes('wrong password') ||
        message.includes('unauthorized') ||
        message.includes('401')
    ) {
        return 'Неверная почта или пароль';
    }

    if (
        message.includes('not found') ||
        message.includes('user not found') ||
        message.includes('account not found')
    ) {
        return 'Аккаунт с такой почтой не найден';
    }

    if (message.includes('too many requests') || message.includes('429')) {
        return 'Слишком много попыток входа. Попробуйте позже';
    }

    return 'Не удалось выполнить вход. Попробуйте еще раз';
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const { setAccessToken, setUser } = useAuth();
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isTelegramMiniApp = Boolean(getTelegramInitData());

    const handleSubmit = async () => {
        const trimmedLogin = login.trim();
        if (!trimmedLogin) {
            setEmailError('Введите почту');
            return;
        }
        if (!isValidEmail(trimmedLogin)) {
            setEmailError('Неверная почта');
            return;
        }
        if (!password) {
            setPasswordError('Введите пароль');
            return;
        }
        setEmailError('');
        setPasswordError('');
        setIsLoading(true);
        try {
            const response = await authService.login({
                login: trimmedLogin,
                password,
            });
            if (!response.access_token) {
                throw new Error('Access token not received');
            }
            setAccessToken(response.access_token);
            const userData = await authService.getCurrentUser();
            setUser({
                id: userData.id,
                name: userData.name,
                country: userData.country,
                city: userData.city,
            });
            navigate('/', { replace: true });
        } catch (error) {
            setPasswordError(getFriendlyLoginError(error));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isTelegramMiniApp) {
            navigate('/register', { replace: true });
        }
    }, [isTelegramMiniApp, navigate]);

    if (isTelegramMiniApp) return null;

    return (
        <div className="registration-container">
            <div className="registration-content">
                <div className="registration-step">
                    <div className="step-3-title-row">
                        <button
                            type="button"
                            className="back-button"
                            onClick={() => navigate('/register')}
                            aria-label="Назад"
                        >
                            <svg width="11" height="23" viewBox="0 0 11 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M10.5195 22.6368C11.1105 22.1093 11.1636 21.2007 10.6382 20.6074L3.36949 12.3985C3.1151 12.1112 2.97984 11.9569 2.89061 11.8386C2.8875 11.8345 2.88456 11.8306 2.88178 11.8268C2.88443 11.8229 2.88723 11.8189 2.89019 11.8147C2.97519 11.6933 3.10492 11.5343 3.34901 11.2381L10.6713 2.35397C11.1754 1.74231 11.0902 0.836171 10.481 0.330039C9.87174 -0.176091 8.9692 -0.0905485 8.46508 0.521104L1.11575 9.43811C0.909417 9.68839 0.705494 9.93574 0.54769 10.1611C0.372178 10.4117 0.190088 10.7212 0.0902292 11.1111C-0.0386452 11.6143 -0.0293129 12.1431 0.117234 12.6413C0.230786 13.0274 0.423683 13.3303 0.607927 13.5745C0.773579 13.7941 0.986095 14.034 1.20112 14.2768C1.21052 14.2874 1.21994 14.298 1.22935 14.3087L8.49811 22.5176C9.02349 23.1109 9.92849 23.1643 10.5195 22.6368Z" fill="#414141" />
                            </svg>
                        </button>
                        <h1 className="step-title step-title-inline">Вход в Eventify</h1>
                    </div>

                    <div className="input-wrapper">
                        <label className="input-label">Почта</label>
                        <div className="input-container">
                            <input
                                type="email"
                                className={`registration-input ${emailError ? 'error' : ''}`}
                                placeholder="Почта"
                                value={login}
                                onChange={(e) => {
                                    setLogin(e.target.value);
                                    if (emailError) setEmailError('');
                                }}
                                autoComplete="email"
                            />
                        </div>
                        {emailError && <span className="error-message">{emailError}</span>}
                    </div>

                    <div className="input-wrapper">
                        <label className="input-label">Пароль</label>
                        <div className="input-container input-container-with-icon">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`registration-input ${passwordError ? 'error' : ''}`}
                                placeholder="Введите пароль"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (passwordError) setPasswordError('');
                                }}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-visibility-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                            >
                                {showPassword ? 'Скрыть' : 'Показать'}
                            </button>
                        </div>
                        {passwordError && <span className="error-message">{passwordError}</span>}
                    </div>

                    <button
                        type="button"
                        className="continue-button"
                        onClick={handleSubmit}
                        disabled={isLoading || !login.trim() || !password}
                    >
                        Продолжить
                    </button>
                </div>
            </div>
        </div>
    );
};
