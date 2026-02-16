import { useState, useEffect, useRef, useCallback } from 'react';
import { INTERESTS_LIST } from '../constants/interests';
import type { FiltersData } from '../services/eventsService';
import './FiltersModal.css';

interface FiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FiltersState) => void;
    availableFilters?: FiltersData;
}

interface FiltersState {
    cities: string[];
    districts: string[];
    priceRange: [number, number];
    dateType: 'today' | 'tomorrow' | 'weekends' | 'weekdays' | null;
    weekdays: boolean;
    exactDate: string;
    formats: string[];
    interests: string[];
}

const CITIES = ['Тбилиси', 'Сухуми', 'Телави', 'Тержола'];
const FORMATS = ['Онлайн', 'Офлайн'];
const MAX_PRICE = 10000;

export const FiltersModal = ({ isOpen, onClose, onApply, availableFilters }: FiltersModalProps) => {
    const [filters, setFilters] = useState<FiltersState>({
        cities: [],
        districts: [],
        priceRange: [
            availableFilters?.min_price ?? 0,
            availableFilters?.max_price ?? MAX_PRICE
        ],
        dateType: null,
        weekdays: false,
        exactDate: '',
        formats: [],
        interests: [],
    });

    const [exactDateError, setExactDateError] = useState(false);
    const [showExactDateInput, setShowExactDateInput] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const showCitiesSection = !availableFilters?.cities || availableFilters.cities.length > 0;
    const showInterestsSection = !availableFilters?.categories || availableFilters.categories.length > 0;
    const citiesList = availableFilters?.cities && availableFilters.cities.length > 0
        ? availableFilters.cities
        : CITIES;
    const interestsList = availableFilters?.categories && availableFilters.categories.length > 0
        ? availableFilters.categories
        : INTERESTS_LIST;

    const handleClose = useCallback(() => {
        if (isClosing) return; // Предотвращаем множественные вызовы
        setIsClosing(true);
        document.body.style.overflow = '';
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            // Сбрасываем состояние после закрытия, но сохраняем точную дату если она задана
            const hasExactDate = filters.exactDate.trim().length > 0;
            setShowExactDateInput(hasExactDate);
            if (!hasExactDate) {
                setExactDateError(false);
            }
        }, 300); // Время анимации закрытия
    }, [filters.exactDate, isClosing, onClose]);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || isClosing || !availableFilters) return;
        setFilters(prev => ({
            ...prev,
            priceRange: [
                availableFilters.min_price ?? 0,
                availableFilters.max_price ?? MAX_PRICE
            ]
        }));
    }, [isOpen, isClosing, availableFilters]);

    useEffect(() => {
        if (!isOpen || isClosing) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isClosing, handleClose]);

    const toggleCity = (city: string) => {
        setFilters(prev => ({
            ...prev,
            cities: prev.cities.includes(city)
                ? [] // Если город уже выбран, снимаем выбор
                : [city], // Выбираем только этот город
        }));
    };

    const toggleFormat = (format: string) => {
        setFilters(prev => ({
            ...prev,
            formats: prev.formats.includes(format)
                ? prev.formats.filter(f => f !== format)
                : [...prev.formats, format],
        }));
    };

    const toggleInterest = (interestCode: string) => {
        setFilters(prev => ({
            ...prev,
            interests: prev.interests.includes(interestCode)
                ? prev.interests.filter(i => i !== interestCode)
                : [...prev.interests, interestCode],
        }));
    };

    const handlePriceChange = (index: number, value: number) => {
        setFilters(prev => {
            const newRange: [number, number] = [...prev.priceRange];
            const maxPrice = availableFilters?.max_price ?? MAX_PRICE;
            const minPrice = availableFilters?.min_price ?? 0;
            
            // Clamp value to valid range
            if (index === 0) {
                // Min price: ensure it's between minPrice and maxPrice, and <= max value
                newRange[0] = Math.max(minPrice, Math.min(value, newRange[1], maxPrice));
            } else {
                // Max price: ensure it's between minPrice and maxPrice, and >= min value
                newRange[1] = Math.min(maxPrice, Math.max(value, newRange[0], minPrice));
            }
            
            // Ensure min <= max
            if (newRange[0] > newRange[1]) {
                if (index === 0) {
                    newRange[1] = newRange[0];
                } else {
                    newRange[0] = newRange[1];
                }
            }
            
            return { ...prev, priceRange: newRange };
        });
    };

    const handleExactDateChange = (value: string) => {
        setFilters(prev => ({ ...prev, exactDate: value }));
        
        // Validate date format DD.MM.YYYY
        const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        
        
        if (!value || value.length === 0) {
            setExactDateError(false);
            return;
        }
        
        if (!dateRegex.test(value)) {
            setExactDateError(true);
            return;
        }

        // Проверяем корректность даты
        const [, day, month, year] = value.match(dateRegex) || [];
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Проверка диапазонов
        if (monthNum < 1 || monthNum > 12) {
            setExactDateError(true);
            return;
        }

        if (dayNum < 1 || dayNum > 31) {
            setExactDateError(true);
            return;
        }

        if (yearNum < 1900 || yearNum > 2100) {
            setExactDateError(true);
            return;
        }

        // Проверка корректности даты через Date
        const date = new Date(yearNum, monthNum - 1, dayNum);
        const isValid = date.getDate() === dayNum &&
                       date.getMonth() === monthNum - 1 &&
                       date.getFullYear() === yearNum;
        
        setExactDateError(!isValid);
    };

    const formatDateInput = (value: string) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');

        // Format as DD.MM.YYYY
        if (digits.length <= 2) {
            return digits;
        } else if (digits.length <= 4) {
            return `${digits.slice(0, 2)}.${digits.slice(2)}`;
        } else {
            return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
        }
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDateInput(e.target.value);
        if (formatted.length <= 10) {
            handleExactDateChange(formatted);
        }
    };

    // Кнопка disabled если:
    // 1. Поле ввода даты открыто и дата не введена полностью (меньше 10 символов)
    // 2. Или поле ввода даты открыто и дата некорректна
    const isApplyDisabled = showExactDateInput && (
        filters.exactDate.length < 10 || 
        exactDateError
    );

    const handleApply = () => {
        if (!isApplyDisabled) {
            onApply(filters);
            handleClose();
        }
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div className={`filters-modal-overlay ${isClosing ? 'closing' : ''}`}>
            <div className={`filters-modal ${isClosing ? 'closing' : ''}`} ref={modalRef}>
                <div className="filters-header">
                    <h2 className="filters-title">Фильтры</h2>
                </div>

                <div className="filters-content">
                    {/* Город */}
                    {showCitiesSection && (
                        <div className="filter-section">
                            <div className="filter-section-header">
                                <label className="filter-label">Город</label>
                            </div>
                            <div className="filter-chips">
                                {citiesList.map(city => (
                                    <button
                                        key={city}
                                        className={`filter-chip ${filters.cities.includes(city) ? 'active' : ''}`}
                                        onClick={() => toggleCity(city)}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Район */}
                    {/* <div className="filter-section">
                        <div className="filter-section-header">
                            <div>
                                <label className="filter-label">Район</label>
                                <span className="filter-subtitle">ТБИЛИСИ</span>
                            </div>
                            <button className="filter-all-button">
                                <span>ВСЕ</span>

                                <svg xmlns="http://www.w3.org/2000/svg" width="5" height="11" viewBox="0 0 5 11" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.218423 10.8263C-0.0502057 10.574 -0.074377 10.1395 0.164435 9.85571L3.46842 5.9297C3.58404 5.79231 3.64553 5.71851 3.68608 5.66194C3.6875 5.65997 3.68884 5.65809 3.6901 5.65629C3.6889 5.65445 3.68762 5.65252 3.68628 5.6505C3.64764 5.59245 3.58867 5.5164 3.47772 5.37476L0.149422 1.12581C-0.0797227 0.83328 -0.0409939 0.399908 0.235925 0.157844C0.512845 -0.0842185 0.923092 -0.0433068 1.15224 0.249223L4.49284 4.51388C4.58663 4.63358 4.67932 4.75188 4.75105 4.85964C4.83083 4.9795 4.9136 5.12754 4.95899 5.314C5.01757 5.55465 5.01332 5.80756 4.94671 6.04585C4.8951 6.2305 4.80742 6.37535 4.72367 6.49215C4.64837 6.59716 4.55178 6.71191 4.45404 6.82802C4.44976 6.8331 4.44548 6.83819 4.44121 6.84327L1.13722 10.7693C0.898413 11.053 0.487052 11.0786 0.218423 10.8263Z" fill="#414141" />
                                </svg>
                            </button>
                        </div>
                        <div className="filter-chips filter-chips-grid">
                            {DISTRICTS.map(district => (
                                <button
                                    key={district}
                                    className={`filter-chip ${filters.districts.includes(district) ? 'active' : ''}`}
                                    onClick={() => toggleDistrict(district)}
                                >
                                    {district}
                                </button>
                            ))}
                        </div>
                    </div> */}

                    {/* Цена */}
                    <div className="filter-section">
                        <label className="filter-label">Цена</label>
                        <div className="price-range-container">
                            <div className="price-inputs">
                                <div className="price-input-wrapper">
                                    <span className="price-prefix">От</span>
                                    <input
                                        type="number"
                                        className="price-input"
                                        value={filters.priceRange[0]}
                                        onChange={(e) => handlePriceChange(0, parseInt(e.target.value) || 0)}
                                        min={availableFilters?.min_price ?? 0}
                                        max={availableFilters?.max_price ?? MAX_PRICE}
                                    />
                                </div>
                                <div className="price-input-wrapper">
                                    <span className="price-prefix">До</span>
                                    <input
                                        type="number"
                                        className="price-input"
                                        value={filters.priceRange[1]}
                                        onChange={(e) => handlePriceChange(1, parseInt(e.target.value) || (availableFilters?.max_price ?? MAX_PRICE))}
                                        min={availableFilters?.min_price ?? 0}
                                        max={availableFilters?.max_price ?? MAX_PRICE}
                                    />
                                </div>
                            </div>
                            <div
                                className="price-slider-container"
                                style={{
                                    ['--slider-min' as string]: `${Math.max(0, Math.min(100, ((filters.priceRange[0] - (availableFilters?.min_price ?? 0)) / ((availableFilters?.max_price ?? MAX_PRICE) - (availableFilters?.min_price ?? 0))) * 100))}%`,
                                    ['--slider-max' as string]: `${Math.max(0, Math.min(100, ((filters.priceRange[1] - (availableFilters?.min_price ?? 0)) / ((availableFilters?.max_price ?? MAX_PRICE) - (availableFilters?.min_price ?? 0))) * 100))}%`,
                                }}
                            >
                                <input
                                    type="range"
                                    className="price-slider"
                                    min={availableFilters?.min_price ?? 0}
                                    max={availableFilters?.max_price ?? MAX_PRICE}
                                    value={filters.priceRange[0]}
                                    onChange={(e) => handlePriceChange(0, parseInt(e.target.value))}
                                />
                                <input
                                    type="range"
                                    className="price-slider"
                                    min={availableFilters?.min_price ?? 0}
                                    max={availableFilters?.max_price ?? MAX_PRICE}
                                    value={filters.priceRange[1]}
                                    onChange={(e) => handlePriceChange(1, parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Дата */}
                    <div className="filter-section">
                        <label className="filter-label">Дата</label>
                        <div className="date-options">
                            <div className="date-radio-group">
                                <button
                                    className={`date-radio ${filters.dateType === 'today' ? 'active' : ''}`}
                                    onClick={() => {
                                        setFilters(prev => ({ 
                                            ...prev, 
                                            dateType: prev.dateType === 'today' ? null : 'today',
                                            exactDate: '' // Очищаем поле точной даты
                                        }));
                                        setShowExactDateInput(false);
                                        setExactDateError(false);
                                    }}
                                >
                                    Сегодня
                                </button>
                                <button
                                    className={`date-radio ${filters.dateType === 'tomorrow' ? 'active' : ''}`}
                                    onClick={() => {
                                        setFilters(prev => ({ 
                                            ...prev, 
                                            dateType: prev.dateType === 'tomorrow' ? null : 'tomorrow',
                                            exactDate: '' // Очищаем поле точной даты
                                        }));
                                        setShowExactDateInput(false);
                                        setExactDateError(false);
                                    }}
                                >
                                    Завтра
                                </button>
                                <button
                                    className={`date-radio ${filters.dateType === 'weekends' ? 'active' : ''}`}
                                    onClick={() => {
                                        setFilters(prev => ({ 
                                            ...prev, 
                                            dateType: prev.dateType === 'weekends' ? null : 'weekends',
                                            exactDate: '' // Очищаем поле точной даты
                                        }));
                                        setShowExactDateInput(false);
                                        setExactDateError(false);
                                    }}
                                >
                                    В выходные
                                </button>

                                <button
                                    className={`date-radio ${filters.dateType === 'weekdays' ? 'active' : ''}`}
                                    onClick={() => {
                                        setFilters(prev => ({ 
                                            ...prev, 
                                            dateType: prev.dateType === 'weekdays' ? null : 'weekdays',
                                            exactDate: '' // Очищаем поле точной даты
                                        }));
                                        setShowExactDateInput(false);
                                        setExactDateError(false);
                                    }}
                                >
                                    В будни
                                </button>
                            </div>
                        
                            {!showExactDateInput ? (
                                <button
                                    className="date-exact-button"
                                    onClick={() => {
                                        setShowExactDateInput(true);
                                        if (!filters.exactDate) {
                                            setFilters(prev => ({ ...prev, exactDate: '' }));
                                        }
                                    }}
                                >
                                    <span>Указать точную дату</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M0.335518 15.7474C-0.0772419 15.3804 -0.114383 14.7484 0.252562 14.3356L5.32927 8.62504C5.50694 8.42519 5.60141 8.31784 5.66373 8.23557C5.6659 8.2327 5.66796 8.22996 5.6699 8.22735C5.66805 8.22467 5.66609 8.22186 5.66402 8.21892C5.60466 8.13449 5.51405 8.02386 5.34357 7.81784L0.229495 1.63754C-0.122597 1.21204 -0.0630883 0.581678 0.362411 0.229585C0.78791 -0.122506 1.41827 -0.0629985 1.77036 0.362501L6.90335 6.56565C7.04745 6.73975 7.18988 6.91183 7.30009 7.06858C7.42268 7.24293 7.54985 7.45826 7.6196 7.72947C7.70961 8.0795 7.70309 8.44737 7.60074 8.79398C7.52143 9.06256 7.3867 9.27325 7.25802 9.44314C7.14233 9.59588 6.9939 9.7628 6.84372 9.93169C6.83715 9.93908 6.83058 9.94647 6.82401 9.95386L1.7473 15.6644C1.38035 16.0772 0.748277 16.1143 0.335518 15.7474Z" fill="#414141"/>
                                    </svg>
                                </button>
                            ) : (
                                <div className="date-input-wrapper">
                                    <input
                                        type="text"
                                        className={`date-input ${exactDateError ? 'error' : ''}`}
                                        placeholder="ДД.ММ.ГГГГ"
                                        value={filters.exactDate}
                                        onChange={handleDateInputChange}
                                        onBlur={() => {
                                            // При потере фокуса проверяем, если поле пустое, скрываем его
                                            if (!filters.exactDate) {
                                                setShowExactDateInput(false);
                                            }
                                        }}
                                        maxLength={10}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Формат мероприятия */}
                    <div className="filter-section">
                        <label className="filter-label">Формат мероприятия</label>
                        <div className="filter-chips">
                            {FORMATS.map(format => (
                                <button
                                    key={format}
                                    className={`filter-chip ${filters.formats.includes(format) ? 'active' : ''}`}
                                    onClick={() => toggleFormat(format)}
                                >
                                    {format}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Интересы */}
                    {showInterestsSection && (
                        <div className="filter-section">
                            <div className="filter-section-header">
                                <label className="filter-label">Интересы</label>
                                <button className="filter-all-button">
                                    <span>ВСЕ</span>

                                    <svg xmlns="http://www.w3.org/2000/svg" width="5" height="11" viewBox="0 0 5 11" fill="none">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.218423 10.8263C-0.0502057 10.574 -0.074377 10.1395 0.164435 9.85571L3.46842 5.9297C3.58404 5.79231 3.64553 5.71851 3.68608 5.66194C3.6875 5.65997 3.68884 5.65809 3.6901 5.65629C3.6889 5.65445 3.68762 5.65252 3.68628 5.6505C3.64764 5.59245 3.58867 5.5164 3.47772 5.37476L0.149422 1.12581C-0.0797227 0.83328 -0.0409939 0.399908 0.235925 0.157844C0.512845 -0.0842185 0.923092 -0.0433068 1.15224 0.249223L4.49284 4.51388C4.58663 4.63358 4.67932 4.75188 4.75105 4.85964C4.83083 4.9795 4.9136 5.12754 4.95899 5.314C5.01757 5.55465 5.01332 5.80756 4.94671 6.04585C4.8951 6.2305 4.80742 6.37535 4.72367 6.49215C4.64837 6.59716 4.55178 6.71191 4.45404 6.82802C4.44976 6.8331 4.44548 6.83819 4.44121 6.84327L1.13722 10.7693C0.898413 11.053 0.487052 11.0786 0.218423 10.8263Z" fill="#414141" />
                                    </svg>
                                </button>
                            </div>
                            <div className="filter-chips filter-chips-scroll">
                                {interestsList.map(interest => (
                                    <button
                                        key={interest.code}
                                        className={`filter-chip ${filters.interests.includes(interest.code) ? 'active' : ''}`}
                                        onClick={() => toggleInterest(interest.code)}
                                    >
                                        {'title' in interest ? interest.title : interest.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="filters-footer">
                    <button
                        className="filters-apply-button"
                        onClick={handleApply}
                        disabled={isApplyDisabled}
                    >
                        Применить
                    </button>
                </div>
            </div>
        </div>
    );
};

