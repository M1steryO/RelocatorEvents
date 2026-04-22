import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { INTERESTS_LIST } from '../constants/interests';
import { getTelegramInitData, isTelegramMiniApp as detectTelegramMiniApp } from '../utils/telegramInitData';
import './RegistrationForm.css';

interface RegistrationFormProps {
    onSuccess?: () => void;
}


// Sample cities for Georgia (can be replaced with API data)
const CITIES_BY_COUNTRY: Record<string, string[]> = {
    'Грузия': ['Тбилиси', 'Батуми'],
};

// List of available countries
const AVAILABLE_COUNTRIES = Object.keys(CITIES_BY_COUNTRY);
const LANGUAGE_OPTIONS = ['Русский', 'Английский', 'Грузинский'];
const LANGUAGE_CODE_BY_LABEL: Record<string, 'ru' | 'en' | 'ge'> = {
    Русский: 'ru',
    Английский: 'en',
    Грузинский: 'ge',
};

const getFriendlyRegistrationError = (error: unknown): { field: 'email' | 'password' | 'common'; message: string } => {
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

    if (
        message.includes('already exists') ||
        message.includes('already registered') ||
        message.includes('email exists') ||
        message.includes('duplicate') ||
        message.includes('conflict') ||
        message.includes('409')
    ) {
        return { field: 'email', message: 'Пользователь с такой почтой уже существует' };
    }

    if (
        message.includes('invalid email') ||
        message.includes('email is invalid') ||
        message.includes('bad email')
    ) {
        return { field: 'email', message: 'Неверная почта' };
    }

    if (
        message.includes('password') &&
        (message.includes('weak') || message.includes('invalid') || message.includes('requirements'))
    ) {
        return { field: 'password', message: 'Пароль не соответствует требованиям' };
    }

    if (message.includes('too many requests') || message.includes('429')) {
        return { field: 'common', message: 'Слишком много попыток. Попробуйте позже' };
    }

    return { field: 'common', message: 'Не удалось завершить регистрацию. Попробуйте еще раз' };
};

export const RegistrationForm = ({ onSuccess }: RegistrationFormProps) => {
    const { setAccessToken, setUser } = useAuth();
    const navigate = useNavigate();
    const isTelegramMiniApp = detectTelegramMiniApp();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        language: '',
        country: '',
        city: '',
        interests: [] as string[],
        collections: [] as string[],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [languageError, setLanguageError] = useState<string>('');
    const [countryError, setCountryError] = useState<string>('');
    const [cityError, setCityError] = useState<string>('');
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registrationCommonError, setRegistrationCommonError] = useState('');
    const [showButton, setShowButton] = useState(false);
    const languageDropdownRef = useRef<HTMLDivElement>(null);
    const languageInputRef = useRef<HTMLInputElement>(null);
    const countryDropdownRef = useRef<HTMLDivElement>(null);
    const countryInputRef = useRef<HTMLInputElement>(null);
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const cityInputRef = useRef<HTMLInputElement>(null);

    // Step can be initialized before Telegram context is stable.
    // Keep Telegram flow on step 2, but recover web flow to step 1 when appropriate.
    useEffect(() => {
        if (isTelegramMiniApp) {
            if (step < 2) {
                setStep(2);
            }
            return;
        }

        const isFreshWebRegistration =
            step === 2 &&
            !formData.email.trim() &&
            !formData.password &&
            !formData.confirmPassword &&
            !formData.country.trim() &&
            !formData.city.trim() &&
            !formData.language.trim() &&
            formData.interests.length === 0;

        if (isFreshWebRegistration) {
            setStep(1);
        }
    }, [
        isTelegramMiniApp,
        step,
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.country,
        formData.city,
        formData.language,
        formData.interests.length,
    ]);

    // Render button with small delay to prevent jump on mobile
    useEffect(() => {
        setShowButton(false);
        const timer = setTimeout(() => {
            setShowButton(true);
        }, 300); // Small delay to let CSS apply fixed positioning first

        return () => clearTimeout(timer);
    }, [step]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close language dropdown
            if (
                languageDropdownRef.current &&
                !languageDropdownRef.current.contains(event.target as Node) &&
                languageInputRef.current &&
                !languageInputRef.current.contains(event.target as Node)
            ) {
                setShowLanguageDropdown(false);
            }

            // Close country dropdown
            if (
                countryDropdownRef.current &&
                !countryDropdownRef.current.contains(event.target as Node) &&
                countryInputRef.current &&
                !countryInputRef.current.contains(event.target as Node)
            ) {
                setShowCountryDropdown(false);
            }

            // Close city dropdown
            if (
                cityDropdownRef.current &&
                !cityDropdownRef.current.contains(event.target as Node) &&
                cityInputRef.current &&
                !cityInputRef.current.contains(event.target as Node)
            ) {
                setShowCityDropdown(false);
            }
        };

        if (showLanguageDropdown || showCountryDropdown || showCityDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showLanguageDropdown, showCountryDropdown, showCityDropdown]);

    const handleLanguageSelect = (language: string) => {
        setFormData((prev) => ({ ...prev, language }));
        setShowLanguageDropdown(false);
        if (languageError) {
            setLanguageError('');
        }
    };

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    const getPasswordRequirementErrors = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) errors.push('Минимум 8 символов');
        if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
            errors.push('Минимум одна заглавная и одна строчная латинская буква');
        }
        if (!/\d/.test(password)) errors.push('Минимум одна цифра');
        if (!/[!?@#$%^&*~\-+=(){}\[\]:;'"<>,./\\|_]/.test(password)) {
            errors.push('Минимум один спецсимвол');
        }
        return errors;
    };


    const handleCountrySelect = (country: string) => {
        setFormData((prev) => ({ ...prev, country, city: '' }));
        setShowCountryDropdown(false);
        setShowCityDropdown(false);
        // Clear error when country is selected
        if (countryError) {
            setCountryError('');
        }
    };

    const handleCitySelect = (city: string) => {
        setFormData((prev) => ({ ...prev, city }));
        setShowCityDropdown(false);
        // Clear error when city is selected
        if (cityError) {
            setCityError('');
        }
    };

    const toggleInterest = (interestCode: string) => {
        setFormData((prev) => ({
            ...prev,
            interests: prev.interests.includes(interestCode)
                ? prev.interests.filter((i) => i !== interestCode)
                : [...prev.interests, interestCode],
        }));
    };

    const handleNext = () => {
        // Validate before proceeding
        if (step === 1 && !isTelegramMiniApp) {
            setRegistrationCommonError('');
            const trimmedEmail = formData.email.trim();
            if (!trimmedEmail) {
                setEmailError('Введите почту');
                return;
            }
            if (!validateEmail(trimmedEmail)) {
                setEmailError('Неверная почта');
                return;
            }
            const passwordErrors = getPasswordRequirementErrors(formData.password);
            if (passwordErrors.length > 0) {
                setPasswordError(`Пароль должен соответствовать критериям: ${passwordErrors.join(', ')}`);
                return;
            }
            if (!formData.confirmPassword) {
                setConfirmPasswordError('Подтвердите пароль');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setConfirmPasswordError('Пароль не совпадает');
                return;
            }
            setEmailError('');
            setPasswordError('');
            setConfirmPasswordError('');
        }
        if (step === 2) {
            if (!formData.country.trim()) {
                setCountryError('Пожалуйста, выберите страну');
                return;
            }
            if (!formData.city.trim()) {
                setCityError('Пожалуйста, выберите город');
                return;
            }
            setCountryError('');
            setCityError('');
        }
        if (step === 4) {
            if (!formData.language.trim()) {
                setLanguageError('Пожалуйста, выберите язык');
                return;
            }
            setLanguageError('');
        }

        if (step < 4) {
            setStep(step + 1);
            setShowLanguageDropdown(false);
            setShowCountryDropdown(false);
            setShowCityDropdown(false);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        const canGoBack =
            step > 2 || (!isTelegramMiniApp && step === 2);

        if (canGoBack) {
            setShowLanguageDropdown(false);
            setShowCountryDropdown(false);
            setShowCityDropdown(false);
            setStep(step - 1);
        }
    };

    const handleSkip = () => {
        if (step === 3) {
            setStep(4);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const telegramInitData = getTelegramInitData();
            const telegramUsernameFromInitData =
                window.Telegram?.WebApp?.initDataUnsafe?.user?.username || '';
            const telegramNameFromInitData =
                window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || '';

            const emailForRegistration = telegramInitData
                ? undefined // for Telegram registration we intentionally don't send email
                : formData.email.trim();

            const response = await authService.register({
                telegram_token: telegramInitData || undefined,
                password: telegramInitData ? '' : formData.password,
                password_confirm: telegramInitData ? '' : formData.confirmPassword,
                info: {
                    name: telegramNameFromInitData,
                    telegram_username: telegramUsernameFromInitData,
                    email: emailForRegistration,
                    language: LANGUAGE_CODE_BY_LABEL[formData.language] || (formData.language as 'ru' | 'en' | 'ge'),
                    country: formData.country,
                    city: formData.city,
                    interests: formData.interests.map((interest) => ({ code: interest })),
                }
            });

            // Extract access token from Authorization header
            const accessToken = response.accessTokenFromHeader;

            if (!accessToken) {
                throw new Error('Access token not received from server');
            }

            // Set access token
            setAccessToken(accessToken);

            // Load full user data after registration
            try {
                const userData: { id: number; name: string; country?: string; city?: string; interests?: string[]; collections?: string[] } =
                    await authService.getCurrentUser();
                if (userData) {
                    setUser({
                        id: userData.id,
                        name: userData.name,
                        country: userData.country,
                        city: userData.city,
                    });
                }
            } catch (error) {
                console.error('Failed to load user data after registration:', error);
                // Set minimal user data from response (only id is returned)
                const responseId = (response as any).id;
                if (responseId) {
                    setUser({
                        id: responseId,
                        name: '',
                    });
                }
            }

            // Navigate to profile page
            navigate('/profile');
            onSuccess?.();
        } catch (error) {
            const friendlyError = getFriendlyRegistrationError(error);
            if (friendlyError.field === 'email') {
                setEmailError(friendlyError.message);
                setRegistrationCommonError('');
            } else if (friendlyError.field === 'password') {
                setPasswordError(friendlyError.message);
                setRegistrationCommonError('');
            } else {
                setRegistrationCommonError(friendlyError.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                if (isTelegramMiniApp) return true;
                return (
                    formData.email.trim().length > 0 &&
                    formData.password.length > 0 &&
                    formData.confirmPassword.length > 0 &&
                    !emailError &&
                    !passwordError &&
                    !confirmPasswordError
                );
            case 2:
                return (
                    formData.country.trim().length > 0 &&
                    formData.city.trim().length > 0 &&
                    !countryError
                );
            case 3:
                return true; // Interests are optional
            case 4:
                return formData.language.trim().length > 0 && !languageError;
            default:
                return false;
        }
    };

    const availableCities = formData.country && CITIES_BY_COUNTRY[formData.country]
        ? CITIES_BY_COUNTRY[formData.country]
        : [];

    const renderBackButton = () =>
        step > 1 ? (
            <button
                type="button"
                className="back-button"
                onClick={handleBack}
                aria-label="Назад"
            >
                <svg width="11" height="23" viewBox="0 0 11 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5195 22.6368C11.1105 22.1093 11.1636 21.2007 10.6382 20.6074L3.36949 12.3985C3.1151 12.1112 2.97984 11.9569 2.89061 11.8386C2.8875 11.8345 2.88456 11.8306 2.88178 11.8268C2.88443 11.8229 2.88723 11.8189 2.89019 11.8147C2.97519 11.6933 3.10492 11.5343 3.34901 11.2381L10.6713 2.35397C11.1754 1.74231 11.0902 0.836171 10.481 0.330039C9.87174 -0.176091 8.9692 -0.0905485 8.46508 0.521104L1.11575 9.43811C0.909417 9.68839 0.705494 9.93574 0.54769 10.1611C0.372178 10.4117 0.190088 10.7212 0.0902292 11.1111C-0.0386452 11.6143 -0.0293129 12.1431 0.117234 12.6413C0.230786 13.0274 0.423683 13.3303 0.607927 13.5745C0.773579 13.7941 0.986095 14.034 1.20112 14.2768C1.21052 14.2874 1.21994 14.298 1.22935 14.3087L8.49811 22.5176C9.02349 23.1109 9.92849 23.1643 10.5195 22.6368Z" fill="#414141" />
                </svg>

            </button>
        ) : null;

    return (
        <div className="registration-container">
            <div className="registration-content">
                {/* Step 1: Web credentials */}
                {step === 1 && !isTelegramMiniApp && (
                    <div className="registration-step">
                        <div className="step-3-title-row">
                            <h1 className="step-title step-title-inline">Добро пожаловать<br />в Eventify</h1>
                        </div>
                        <div className="input-wrapper">
                            <label className="input-label">Почта</label>
                            <div className="input-container">
                                <input
                                    type="email"
                                    className={`registration-input ${emailError ? 'error' : ''}`}
                                    placeholder="Почта"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, email: e.target.value }));
                                        if (emailError) setEmailError('');
                                        if (registrationCommonError) setRegistrationCommonError('');
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
                                    value={formData.password}
                                    onChange={(e) => {
                                        const nextPassword = e.target.value;
                                        setFormData((prev) => ({ ...prev, password: nextPassword }));
                                        const passwordErrors = getPasswordRequirementErrors(nextPassword);
                                        setPasswordError(
                                            passwordErrors.length
                                                ? `Пароль должен соответствовать критериям: ${passwordErrors.join(', ')}`
                                                : '',
                                        );
                                        if (formData.confirmPassword && formData.confirmPassword !== nextPassword) {
                                            setConfirmPasswordError('Пароль не совпадает');
                                        } else {
                                            setConfirmPasswordError('');
                                        }
                                        if (registrationCommonError) setRegistrationCommonError('');
                                    }}
                                    autoComplete="new-password"
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
                        <div className="input-wrapper">
                            <label className="input-label">Подтвердите пароль</label>
                            <div className="input-container input-container-with-icon">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`registration-input ${confirmPasswordError ? 'error' : ''}`}
                                    placeholder="Введите пароль"
                                    value={formData.confirmPassword}
                                    onChange={(e) => {
                                        const nextConfirm = e.target.value;
                                        setFormData((prev) => ({ ...prev, confirmPassword: nextConfirm }));
                                        if (nextConfirm && nextConfirm !== formData.password) {
                                            setConfirmPasswordError('Пароль не совпадает');
                                        } else {
                                            setConfirmPasswordError('');
                                        }
                                        if (registrationCommonError) setRegistrationCommonError('');
                                    }}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-visibility-toggle"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                                >
                                    {showConfirmPassword ? 'Скрыть' : 'Показать'}
                                </button>
                            </div>
                            {confirmPasswordError && <span className="error-message">{confirmPasswordError}</span>}
                        </div>
                        {registrationCommonError && <span className="error-message">{registrationCommonError}</span>}
                        {showButton && (
                            <button
                                className="continue-button"
                                onClick={handleNext}
                                disabled={isLoading || !canProceed()}
                            >
                                Продолжить
                            </button>
                        )}
                        <button
                            type="button"
                            className="auth-link-button"
                            onClick={() => navigate('/login')}
                        >
                            Уже есть аккаунт? Войти
                        </button>
                    </div>
                )}

                {/* Step 2: Region Selection */}
                {step === 2 && (
                    <div className="registration-step">
                        {!isTelegramMiniApp ? (
                            <div className="step-3-title-row">
                                {renderBackButton()}
                                <h1 className="step-title step-title-inline">Укажите ваш регион</h1>
                            </div>
                        ) : (
                            <div className="step-header">
                                <h1 className="step-title">Укажите ваш регион</h1>
                            </div>
                        )}
                        <div className="step-header">
                            <p className="step-description">
                                Это нужно для поиска мероприятий именно в вашем регионе
                            </p>
                        </div>
                        <div className="input-wrapper">
                            <label className="input-label">Страна</label>
                            <div className="input-container">
                                <input
                                    ref={countryInputRef}
                                    type="text"
                                    className={`registration-input ${countryError ? 'error' : ''}`}
                                    placeholder="Страна"
                                    value={formData.country}
                                    readOnly
                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !showCountryDropdown) {
                                            e.preventDefault();
                                            if (formData.country) {
                                                handleNext();
                                            }
                                        }
                                    }}
                                    autoFocus
                                />
                                <span className="dropdown-icon"></span>
                            </div>
                            {countryError && (
                                <span className="error-message">{countryError}</span>
                            )}
                            {showCountryDropdown && (
                                <div ref={countryDropdownRef} className="city-dropdown">
                                    {AVAILABLE_COUNTRIES.map((country) => (
                                        <div
                                            key={country}
                                            className="city-option"
                                            onClick={() => handleCountrySelect(country)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCountrySelect(country);
                                                }
                                            }}
                                            tabIndex={0}
                                        >
                                            {country}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="input-wrapper">
                            <label className="input-label">Город</label>
                            <div className="input-container">
                                <input
                                    ref={cityInputRef}
                                    type="text"
                                    className={`registration-input ${cityError ? 'error' : ''}`}
                                    placeholder="Город"
                                    value={formData.city}
                                    readOnly
                                    disabled={availableCities.length === 0}
                                    onClick={() => availableCities.length > 0 && setShowCityDropdown(!showCityDropdown)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !showCityDropdown && canProceed() && !isLoading) {
                                            e.preventDefault();
                                            handleNext();
                                        }
                                    }}
                                />
                                {availableCities.length > 0 && <span className="dropdown-icon"></span>}
                            </div>
                            {cityError && (
                                <span className="error-message">{cityError}</span>
                            )}
                            {showCityDropdown && availableCities.length > 0 && (
                                <div ref={cityDropdownRef} className="city-dropdown">
                                    {availableCities.map((city) => (
                                        <div
                                            key={city}
                                            className="city-option"
                                            onClick={() => handleCitySelect(city)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCitySelect(city);
                                                }
                                            }}
                                            tabIndex={0}
                                        >
                                            {city}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {showButton && (
                            <button
                                className="continue-button"
                                onClick={handleNext}
                                disabled={isLoading || !canProceed()}
                            >
                                Продолжить
                            </button>
                        )}
                    </div>
                )}

                {/* Step 4: Language Selection */}
                {step === 4 && (
                    <div className="registration-step">
                        <div className="step-3-title-row">
                            {renderBackButton()}
                            <h1 className="step-title step-title-inline">Укажите ваш<br />родной язык</h1>
                        </div>
                        <div className="step-header">
                            <p className="step-description">
                                Это нужно для поиска мероприятий и новых знакомств
                            </p>
                        </div>
                        <div className="input-wrapper">
                            <label className="input-label">Язык</label>
                            <div className="input-container">
                                <input
                                    ref={languageInputRef}
                                    type="text"
                                    className={`registration-input ${languageError ? 'error' : ''}`}
                                    placeholder="Язык"
                                    value={formData.language}
                                    readOnly
                                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !showLanguageDropdown && canProceed() && !isLoading) {
                                            e.preventDefault();
                                            handleNext();
                                        }
                                    }}
                                />
                                <span className="dropdown-icon"></span>
                            </div>
                            {languageError && (
                                <span className="error-message">{languageError}</span>
                            )}
                            {showLanguageDropdown && (
                                <div ref={languageDropdownRef} className="city-dropdown">
                                    {LANGUAGE_OPTIONS.map((language) => (
                                        <div
                                            key={language}
                                            className="city-option"
                                            onClick={() => handleLanguageSelect(language)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleLanguageSelect(language);
                                                }
                                            }}
                                            tabIndex={0}
                                        >
                                            {language}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {showButton && (
                            <button
                                className="continue-button"
                                onClick={handleNext}
                                disabled={isLoading || !canProceed()}
                            >
                                Продолжить
                            </button>
                        )}
                    </div>
                )}

                {/* Step 3: Interests Selection */}
                {step === 3 && (
                    <div className="registration-step registration-step-interests">
                        <div className="step-3-title-row">
                            {renderBackButton()}
                            <h1 className="step-title step-title-inline">Выберите ваши интересы</h1>
                        </div>
                        <p className="step-description">
                            позже их можно будет поменять
                        </p>
                        <div className="interests-grid">
                            {INTERESTS_LIST.map((interest) => (
                                <button
                                    key={interest.code}
                                    type="button"
                                    className={`interest-button ${formData.interests.includes(interest.code) ? 'selected' : ''
                                        }`}
                                    onClick={() => toggleInterest(interest.code)}
                                >
                                    <span className="interest-button-text">{interest.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="skip-link" onClick={handleSkip}>
                            <span>Пропустить</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="16" viewBox="0 0 10 16"
                                fill="none">
                                <path d="M1 1L9 8L1 15" stroke="#458DBD" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        {showButton && (
                            <button
                                className="continue-button"
                                onClick={handleNext}
                                disabled={isLoading || formData.interests.length === 0}
                            >
                                Продолжить
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
