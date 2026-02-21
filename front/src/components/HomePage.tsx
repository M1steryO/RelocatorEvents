import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsService } from '../services/eventsService';
import type { Event as ServerEvent, GetListRequest, FiltersData } from '../services/eventsService';
import { FiltersModal, type FiltersState } from './FiltersModal';
import { SortModal } from './SortModal';
import { NotFoundCard } from './NotFoundCard';
import './HomePage.css';

interface DisplayEvent {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
    rating: number;
    reviewsCount: number;
    price: number;
    currencySymbol: string;
    distance?: number;
    image: string;
}

// Helper function to format date from timestamp string
const formatDate = (timestamp?: string): { date: string; time: string } => {
    if (!timestamp) {
        return { date: '', time: '' };
    }

    try {
        // Parse string timestamp (can be Unix timestamp in seconds or milliseconds, or ISO string)
        const numTimestamp = Number(timestamp);
        let date: Date;

        if (!isNaN(numTimestamp)) {
            // String representation of number timestamp
            // Check if it's in seconds (< 1000000000000) or milliseconds
            date = new Date(numTimestamp > 1000000000000 ? numTimestamp : numTimestamp * 1000);
        } else {
            // ISO string format
            date = new Date(timestamp);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return { date: '', time: '' };
        }

        const day = date.getDate();
        // Get month in genitive case (родительный падеж) for Russian
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        const month = months[date.getMonth()];
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return {
            date: `${day} ${month}`,
            time: `${hours}:${minutes}`
        };
    } catch {
        return { date: '', time: '' };
    }
};

const getCurrencySymbol = (currency?: string): string => {
    if (!currency) {
        return '₽';
    }

    const normalized = currency.toUpperCase();
    const symbols: Record<string, string> = {
        USD: '$',
        GEL: '₾',
        EUR: '€',
        RUB: '₽',
    };

    return symbols[normalized] || currency;
};

// Helper function to convert server event to display event
const convertEventToDisplay = (event: ServerEvent): DisplayEvent => {
    // Extract date and time from starts_at timestamp
    const { date, time } = formatDate(event.starts_at);

    return {
        id: event.id,
        title: event.title,
        description: event.description || '',
        date, // Date from starts_at in format "29 мая"
        time, // Time from starts_at in format "20:00"
        rating: event.rating || 0,
        reviewsCount: event.reviews_count || 0,
        price: event.min_price || 0,
        currencySymbol: getCurrencySymbol(event.currency),
        distance: undefined, // Distance not in API response
        image: event.image_url || '/event-no-img.png'
    };
};

export const HomePage = () => {
    const navigate = useNavigate();
    const PAGE_LIMIT = 20;
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ДЛЯ ВАС');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [currentSort, setCurrentSort] = useState('popular');
    const [events, setEvents] = useState<DisplayEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<GetListRequest>({});
    const [uiFilters, setUiFilters] = useState<FiltersState | null>(null);
    const [availableFilters, setAvailableFilters] = useState<FiltersData | null>(null);
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const lastRequestRef = useRef<{ key: string; time: number } | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const restoredFromSessionRef = useRef(false);
    const skipNextDebounceRef = useRef(false);

    const tabs = ['ДЛЯ ВАС', 'ПОГРУЗИТЕСЬ В НОВУЮ КУЛЬТУРУ', 'ПОПУЛЯРНО'];

    // Map sort option to API sort parameter
    const getSortParam = (sort: string): string => {
        switch (sort) {
            case 'popular': return 'popular';
            case 'rating': return 'rating';
            case 'cheaper': return 'price_asc';
            case 'expensive': return 'price_desc';
            case 'new': return 'new';
            default: return 'popular';
        }
    };

    // Restore feed state and scroll position from sessionStorage on first mount
    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsInitialized(true);
            return;
        }

        try {
            const raw = sessionStorage.getItem('homeFeedState');
            if (raw) {
                const state = JSON.parse(raw) as {
                    didLoad?: boolean;
                    searchQuery?: string;
                    debouncedSearchQuery?: string;
                    activeTab?: string;
                    currentSort?: string;
                    events?: DisplayEvent[];
                    offset?: number;
                    hasMore?: boolean;
                    appliedFilters?: GetListRequest;
                    uiFilters?: FiltersState | null;
                    availableFilters?: FiltersData | null;
                    loadedImages?: Record<number, boolean>;
                    imageErrors?: Record<number, boolean>;
                    scrollY?: number;
                };

                setSearchQuery(state.searchQuery ?? '');
                setDebouncedSearchQuery(state.debouncedSearchQuery ?? state.searchQuery ?? '');
                if (state.activeTab) {
                    setActiveTab(state.activeTab);
                }
                if (state.currentSort) {
                    setCurrentSort(state.currentSort);
                }
                setAppliedFilters(state.appliedFilters ?? {});
                setUiFilters(state.uiFilters ?? null);
                setAvailableFilters(state.availableFilters ?? null);

                // Восстанавливаем список и скролл только если ранее реально загрузили мероприятия.
                // Иначе (пустой список / первый визит) — не помечаем как restore, чтобы ушёл запрос за списком.
                const hasRestorableEvents = state.didLoad && Array.isArray(state.events) && state.events.length > 0;
                if (hasRestorableEvents) {
                    const restoredEvents = state.events ?? [];
                    setEvents(restoredEvents);
                    setOffset(state.offset ?? restoredEvents.length);
                    setHasMore(state.hasMore ?? true);
                    setLoadedImages(state.loadedImages ?? {});
                    setImageErrors(state.imageErrors ?? {});
                    setIsLoading(false);
                    restoredFromSessionRef.current = true;
                    skipNextDebounceRef.current = true;

                    const scrollY = state.scrollY ?? 0;
                    window.requestAnimationFrame(() => {
                        window.scrollTo(0, scrollY);
                    });
                }
            }
        } catch (error) {
            console.error('Failed to restore home feed state:', error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Debounce search input to avoid sending requests on every keystroke
    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        // После восстановления состояния из sessionStorage пропускаем один
        // дебаунс, чтобы не триггерить повторный запрос и не сбрасывать список.
        if (skipNextDebounceRef.current) {
            skipNextDebounceRef.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, isInitialized]);

    const fetchEventsPage = async (nextOffset: number, replace: boolean) => {
        if (replace) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const params: GetListRequest = {
                q: debouncedSearchQuery || undefined,
                sort: getSortParam(currentSort),
                limit: PAGE_LIMIT,
                offset: nextOffset,
                ...appliedFilters,
            };
            const requestKey = JSON.stringify(params);
            const now = Date.now();
            if (lastRequestRef.current?.key === requestKey && now - lastRequestRef.current.time < 500) {
                return;
            }
            lastRequestRef.current = { key: requestKey, time: now };

            const response = await eventsService.getEventsList(params);
            const displayEvents = response.data.map(convertEventToDisplay);

            setEvents(prev => (replace ? displayEvents : [...prev, ...displayEvents]));
            setOffset(nextOffset + displayEvents.length);
            setHasMore(displayEvents.length === PAGE_LIMIT);

            if (response.filters) {
                setAvailableFilters(response.filters);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
            if (replace) {
                setEvents([]);
            }
        } finally {
            if (replace) {
                setIsLoading(false);
            } else {
                setIsLoadingMore(false);
            }
        }
    };

    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        // Если только что восстановили состояние из sessionStorage — пропускаем первый запуск
        if (restoredFromSessionRef.current) {
            restoredFromSessionRef.current = false;
            return;
        }

        lastRequestRef.current = null;
        setOffset(0);
        setHasMore(true);
        fetchEventsPage(0, true);
    }, [debouncedSearchQuery, currentSort, appliedFilters, isInitialized]);

    useEffect(() => {
        const handleScroll = () => {
            if (isLoading || isLoadingMore || !hasMore) {
                return;
            }

            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.documentElement.scrollHeight - 300;
            if (scrollPosition >= threshold) {
                fetchEventsPage(offset, false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [offset, hasMore, isLoading, isLoadingMore, debouncedSearchQuery, currentSort, appliedFilters]);

    // Сохраняем состояние ленты и позицию скролла при размонтировании
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        return () => {
            try {
                const state = {
                    didLoad: true,
                    searchQuery,
                    debouncedSearchQuery,
                    activeTab,
                    currentSort,
                    events,
                    offset,
                    hasMore,
                    appliedFilters,
                    uiFilters,
                    availableFilters,
                    loadedImages,
                    imageErrors,
                    scrollY: window.scrollY,
                };
                sessionStorage.setItem('homeFeedState', JSON.stringify(state));
            } catch (error) {
                console.error('Failed to persist home feed state:', error);
            }
        };
    }, [
        searchQuery,
        debouncedSearchQuery,
        activeTab,
        currentSort,
        events,
        offset,
        hasMore,
        appliedFilters,
        availableFilters,
        uiFilters,
        loadedImages,
        imageErrors,
    ]);

    const handleImageLoad = (id: number) => {
        setLoadedImages(prev => ({ ...prev, [id]: true }));
        setImageErrors(prev => ({ ...prev, [id]: false }));
    };

    const handleImageError = (id: number) => {
        setImageErrors(prev => ({ ...prev, [id]: true }));
    };

    return (
        <div className="home-page">
            {/* Header */}
            <header className="home-header">
                <div className="logo-container">
                    <img src="/eventify-main-page-logo.svg" alt="EVENTIFY" className="eventify-logo" />
                </div>

                {/* Search Bar */}
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="19" height="22" viewBox="0 0 21 22" fill="none">
                            <circle cx="8" cy="8" r="6.75" stroke="#414141" stroke-width="2.5" />
                            <line x1="12.8068" y1="14" x2="19.0391" y2="20.2322" stroke="#414141" stroke-width="2.5" stroke-linecap="round" />
                        </svg>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Театр"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        className="action-button active"
                        onClick={() => setIsSortOpen(true)}
                    >
                        {currentSort === 'popular' ? 'Популярное' :
                            currentSort === 'rating' ? 'По рейтингу' :
                                currentSort === 'cheaper' ? 'Дешевле' :
                                    currentSort === 'expensive' ? 'Дороже' :
                                        currentSort === 'new' ? 'Новинки' : 'Популярное'}
                        <svg width="26" height="19" viewBox="0 0 26 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.36377 1C8.36377 0.447715 7.91605 0 7.36377 0C6.81148 0 6.36377 0.447715 6.36377 1H7.36377H8.36377ZM6.65666 18.7071C7.04719 19.0976 7.68035 19.0976 8.07088 18.7071L14.4348 12.3431C14.8254 11.9526 14.8254 11.3195 14.4348 10.9289C14.0443 10.5384 13.4111 10.5384 13.0206 10.9289L7.36377 16.5858L1.70692 10.9289C1.31639 10.5384 0.683226 10.5384 0.292702 10.9289C-0.0978227 11.3195 -0.0978227 11.9526 0.292702 12.3431L6.65666 18.7071ZM17.3638 18C17.3638 18.5523 17.8115 19 18.3638 19C18.9161 19 19.3638 18.5523 19.3638 18H18.3638H17.3638ZM19.0709 0.292893C18.6804 -0.0976311 18.0472 -0.0976311 17.6567 0.292893L11.2927 6.65685C10.9022 7.04738 10.9022 7.68054 11.2927 8.07107C11.6832 8.46159 12.3164 8.46159 12.7069 8.07107L18.3638 2.41421L24.0206 8.07107C24.4111 8.46159 25.0443 8.46159 25.4348 8.07107C25.8254 7.68054 25.8254 7.04738 25.4348 6.65685L19.0709 0.292893ZM7.36377 1H6.36377V18H7.36377H8.36377V1H7.36377ZM18.3638 18H19.3638L19.3638 1L18.3638 1L17.3638 1L17.3638 18H18.3638Z" fill="#458DBD" />
                        </svg>
                    </button>
                    <button
                        className="action-button filter-button"
                        onClick={() => setIsFiltersOpen(true)}
                    >
                        Фильтр
                        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.094 8.46189V13.3346C7.094 13.9609 7.34195 14.5619 7.78399 15.007L10.5368 17.7791C11.0045 18.2501 11.8099 17.9176 11.8065 17.255L11.7607 8.46972C11.7597 8.26984 11.8398 8.07805 11.983 7.93803L17.7792 2.26752C18.2534 1.80358 17.9238 1 17.2593 1H1.74659C1.08666 1 0.754953 1.7941 1.21992 2.26083L6.87849 7.94074C7.01653 8.0793 7.094 8.26664 7.094 8.46189Z" stroke="#458DBD" strokeWidth="2" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Tabs Navigation */}
            <div className="tabs-navigation">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Events Feed */}
            <main className={`events-feed ${isLoading ? 'loading' : ''} ${!isLoading && events.length === 0 ? 'not-found' : ''}`}>
                {isLoading ? (
                    <div className="events-loader">
                        <div className="loader-spinner"></div>
                        <p>Загрузка мероприятий...</p>
                    </div>
                ) : events.length === 0 ? (
                    <NotFoundCard title="НИЧЕГО НЕ НАЙДЕНО"
                        subtitle="Попробуйте выбрать другой фильтр" />
                ) : (
                    events.map((event) => (
                        <div
                            key={event.id}
                            className="event-card"
                            onClick={() => navigate(`/events/${event.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={`event-image-container ${loadedImages[event.id] && !imageErrors[event.id] ? 'loaded' : 'loading'}`}>
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="event-image"
                                    onLoad={() => handleImageLoad(event.id)}
                                    onError={() => handleImageError(event.id)}
                                />
                            </div>
                            <div className="event-content">
                                <h3 className="event-title">{event.title}</h3>
                                <p className="event-description">{event.description}</p>
                                <div className="event-footer-container">
                                    <div className="event-date-time">
                                        {event.date} | {event.time}
                                    </div>
                                    <div className="event-footer">
                                        {event.reviewsCount > 0 && (
                                            <span className="event-rating">{event.rating.toFixed(1).replace('.', ',')} ★</span>
                                        )}
                                        <span className="event-price">{event.price} {event.currencySymbol}</span>
                                        {event.distance !== undefined && (
                                            <span className="event-distance">{event.distance} км</span>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))
                )}
                {isLoadingMore && events.length > 0 && (
                    <div className="events-loader">
                        <div className="loader-spinner"></div>
                        <p>Загрузка мероприятий...</p>
                    </div>
                )}
            </main>

            {/* Filters Modal */}
            <FiltersModal
                isOpen={isFiltersOpen}
                onClose={() => setIsFiltersOpen(false)}
                availableFilters={availableFilters || undefined}
                initialFilters={uiFilters}
                onApply={(filters) => {
                    setUiFilters(filters);
                    const apiFilters: GetListRequest = {};

                    if (filters.cities.length > 0) {
                        apiFilters.city = filters.cities[0]; // API expects single city
                    }
                    if (filters.districts.length > 0) {
                        apiFilters.district = filters.districts[0]; // API expects single district
                    }
                    const maxPrice = availableFilters?.max_price || 10000;
                    if (filters.priceRange[0] > (availableFilters?.min_price || 0) || filters.priceRange[1] < maxPrice) {
                        apiFilters.min_price = filters.priceRange[0];
                        apiFilters.max_price = filters.priceRange[1];
                    }
                    // Обработка даты
                    if (filters.exactDate) {
                        // Если указана точная дата, преобразуем из DD.MM.YYYY в YYYY-MM-DD
                        const dateParts = filters.exactDate.split('.');
                        if (dateParts.length === 3) {
                            const [day, month, year] = dateParts;
                            apiFilters.event_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        } else {
                            // Если формат уже правильный, используем как есть
                            apiFilters.event_date = filters.exactDate;
                        }
                    } else if (filters.dateType) {
                        // Send predefined keywords expected by API
                        apiFilters.event_date = filters.dateType;
                    }
                    if (filters.formats.length > 0) {
                        // Map "Онлайн" -> online, "Офлайн" -> offline
                        const formatMap: Record<string, 'online' | 'offline'> = {
                            'Онлайн': 'online',
                            'Офлайн': 'offline',
                        };
                        const eventType = formatMap[filters.formats[0]];
                        if (eventType) {
                            apiFilters.event_type = eventType;
                        }
                    }
                    if (filters.interests.length > 0) {
                        apiFilters.category = filters.interests;
                    }

                    setAppliedFilters(apiFilters);
                }}
            />

            {/* Sort Modal */}
            <SortModal
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                onApply={(sortOption) => {
                    setCurrentSort(sortOption);
                    console.log('Applied sort:', sortOption);
                    // Здесь можно добавить логику применения сортировки
                }}
                currentSort={currentSort}
            />
        </div>
    );
};

