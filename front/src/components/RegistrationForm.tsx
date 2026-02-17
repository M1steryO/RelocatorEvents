import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {authService} from '../services/authService';
import {INTERESTS_LIST} from '../constants/interests';
import { getTelegramInitData } from '../utils/telegramInitData';
import './RegistrationForm.css';

interface RegistrationFormProps {
    onSuccess?: () => void;
}


// Sample cities for Georgia (can be replaced with API data)
const CITIES_BY_COUNTRY: Record<string, string[]> = {
    'Грузия': ['Сингахи', 'Тбилиси', 'Телави', 'Тержола', 'Батуми', 'Кутаиси'],
    'Россия': ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'],
    'Украина': ['Киев', 'Харьков', 'Одесса', 'Львов'],
};

// List of available countries
const AVAILABLE_COUNTRIES = Object.keys(CITIES_BY_COUNTRY);

export const RegistrationForm = ({onSuccess}: RegistrationFormProps) => {
    const {setAccessToken, setUser} = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(2);
    const [formData, setFormData] = useState({
        country: '',
        city: '',
        interests: [] as string[],
        collections: [] as string[],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [countryError, setCountryError] = useState<string>('');
    const [cityError, setCityError] = useState<string>('');
    const [showButton, setShowButton] = useState(false);
    const countryDropdownRef = useRef<HTMLDivElement>(null);
    const countryInputRef = useRef<HTMLInputElement>(null);
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const cityInputRef = useRef<HTMLInputElement>(null);

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

        if (showCountryDropdown || showCityDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCountryDropdown, showCityDropdown]);


    const handleCountrySelect = (country: string) => {
        setFormData((prev) => ({...prev, country, city: ''}));
        setShowCountryDropdown(false);
        setShowCityDropdown(false);
        // Clear error when country is selected
        if (countryError) {
            setCountryError('');
        }
    };

    const handleCitySelect = (city: string) => {
        setFormData((prev) => ({...prev, city}));
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

        if (step < 3) {
            setStep(step + 1);
            setShowCountryDropdown(false);
            setShowCityDropdown(false);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 2) {
            setShowCountryDropdown(false);
            setShowCityDropdown(false);
            setStep(step - 1);
        }
    };

    const handleSkip = () => {
        if (step === 3) {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const telegramInitData = getTelegramInitData();
            const telegramUsernameFromInitData =
                window.Telegram?.WebApp?.initDataUnsafe?.user?.username || '';

            const response = await authService.register({
                telegram_token: telegramInitData,
                
                password: '',
                confirm_password: '',
                info: {
                    telegram_username: telegramUsernameFromInitData,
                    country: formData.country,
                    city: formData.city,
                    interests: formData.interests.map((interest) => ({code: interest})),
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
                const userId = (response as any).id;
                const userData: { id: number; name: string; country?: string; city?: string; interests?: string[]; collections?: string[] } = await authService.getCurrentUser(userId);
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
            console.log(error);
            // Handle error - could show error message
        } finally {
            setIsLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return true; // Welcome step, always can proceed
            case 2:
                return (
                    formData.country.trim().length > 0 &&
                    formData.city.trim().length > 0 &&
                    !countryError
                );
            case 3:
                return true; // Interests are optional
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
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M15 18L9 12L15 6"
                        stroke="#458DBD"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        ) : null;

    return (
        <div className="registration-container">
            <div className="registration-content">
                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="registration-step">
                        <div className="step-header">
                            <h1 className="step-title">Добро пожаловать!</h1>
                            <p className="step-subtitle">
                                Здесь вы найдете мероприятия в своем городе
                            </p>
                        </div>
                        {showButton && (
                            <button
                                className="continue-button"
                                onClick={handleNext}
                                disabled={isLoading}
                            >
                                Продолжить
                            </button>
                        )}
                    </div>
                )}

                {/* Step 2: Region Selection */}
                {step === 2 && (
                    <div className="registration-step">
                        <div className="step-header">
                            <h1 className="step-title">Укажите ваш регион</h1>
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

                {/* Step 3: Interests Selection */}
                {step === 3 && (
                    <div className="registration-step">
                        {renderBackButton()}
                        <div className="step-header">
                            <h1 className="step-title">Выберите ваши интересы</h1>
                            <p className="step-description">
                                позже их можно будет поменять
                            </p>
                        </div>
                        <div className="interests-grid">
                            {INTERESTS_LIST.map((interest) => (
                                <button
                                    key={interest.code}
                                    type="button"
                                    className={`interest-button ${
                                        formData.interests.includes(interest.code) ? 'selected' : ''
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
                                      stroke-linejoin="round"/>
                            </svg>
                        </div>
                        {showButton && (
                            <button
                                className="continue-button"
                                onClick={handleNext}
                                disabled={isLoading}
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
