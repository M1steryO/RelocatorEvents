import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsService } from '../services/eventsService';
import { authService } from '../services/authService';
import type { Event as ServerEvent, GetListRequest, FiltersData } from '../services/eventsService';
import { FiltersModal, type FiltersState } from './FiltersModal';
import { SortModal } from './SortModal';
import { NotFoundCard } from './NotFoundCard';
import { useFavourites } from '../contexts/FavouritesContext';
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
    /** Из API списка: true — мероприятие в избранном */
    isFavourite?: boolean;
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
        image: event.image_url || '/event-no-img.png',
        isFavourite: event.is_favourite === true,
    };
};

/**
 * При смене подборки (таб) не теряем город/район/цену и прочие поля UI:
 * если в uiFilters пусто, подставляем из уже применённого запроса (appliedFilters).
 */
const mergeUiFiltersForTabOverride = (
    prev: FiltersState | null,
    applied: GetListRequest,
    available: FiltersData | null | undefined,
    nextInterests: string[],
): FiltersState => {
    const minP = available?.min_price ?? 0;
    const maxP = available?.max_price ?? 10000;
    if (!prev) {
        return {
            cities: applied.city ? [applied.city] : [],
            districts: applied.district ? [applied.district] : [],
            priceRange:
                applied.min_price !== undefined || applied.max_price !== undefined
                    ? [applied.min_price ?? minP, applied.max_price ?? maxP]
                    : [minP, maxP],
            dateType: null,
            weekdays: false,
            exactDate: '',
            formats:
                applied.event_type === 'online'
                    ? ['Онлайн']
                    : applied.event_type === 'offline'
                        ? ['Офлайн']
                        : [],
            interests: nextInterests,
        };
    }

    const cities =
        prev.cities.length > 0 ? prev.cities : applied.city ? [applied.city] : [];
    const districts =
        prev.districts.length > 0
            ? prev.districts
            : applied.district
                ? [applied.district]
                : [];

    return {
        ...prev,
        cities,
        districts,
        interests: nextInterests,
    };
};

const DEFAULT_HOME_TAB = 'Вечер для новых друзей';

type StoredHomeFeedRaw = {
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

type HomeFeedSnapshot = {
    hasRestorableEvents: boolean;
    scrollY: number;
    events: DisplayEvent[];
    offset: number;
    hasMore: boolean;
    searchQuery: string;
    debouncedSearchQuery: string;
    activeTab: string;
    currentSort: string;
    appliedFilters: GetListRequest;
    uiFilters: FiltersState | null;
    availableFilters: FiltersData | null;
    loadedImages: Record<number, boolean>;
    imageErrors: Record<number, boolean>;
};

function parseHomeFeedSnapshot(): HomeFeedSnapshot | null {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const raw = sessionStorage.getItem('homeFeedState');
        if (!raw) {
            return null;
        }
        const state = JSON.parse(raw) as StoredHomeFeedRaw;
        const hasRestorableEvents =
            Boolean(state.didLoad) &&
            Array.isArray(state.events) &&
            state.events.length > 0;
        const restoredEvents = hasRestorableEvents ? (state.events ?? []) : [];
        return {
            hasRestorableEvents,
            scrollY: state.scrollY ?? 0,
            events: restoredEvents,
            offset: hasRestorableEvents
                ? (state.offset ?? restoredEvents.length)
                : 0,
            hasMore: state.hasMore ?? true,
            searchQuery: state.searchQuery ?? '',
            debouncedSearchQuery:
                state.debouncedSearchQuery ?? state.searchQuery ?? '',
            activeTab: state.activeTab || DEFAULT_HOME_TAB,
            currentSort: state.currentSort || 'popular',
            appliedFilters: state.appliedFilters ?? {},
            uiFilters: state.uiFilters ?? null,
            availableFilters: state.availableFilters ?? null,
            loadedImages: state.loadedImages ?? {},
            imageErrors: state.imageErrors ?? {},
        };
    } catch (error) {
        console.error('Failed to parse home feed snapshot:', error);
        return null;
    }
}

export const HomePage = () => {
    const navigate = useNavigate();
    const { isFavourite, toggleFavourite } = useFavourites();
    const PAGE_LIMIT = 20;

    const homeSnapshot = useMemo(() => parseHomeFeedSnapshot(), []);

    const [searchQuery, setSearchQuery] = useState(
        () => homeSnapshot?.searchQuery ?? '',
    );
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
        () => homeSnapshot?.debouncedSearchQuery ?? '',
    );
    const [activeTab, setActiveTab] = useState(
        () => homeSnapshot?.activeTab ?? DEFAULT_HOME_TAB,
    );
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [currentSort, setCurrentSort] = useState(
        () => homeSnapshot?.currentSort ?? 'popular',
    );
    const [events, setEvents] = useState<DisplayEvent[]>(
        () => homeSnapshot?.events ?? [],
    );
    const [isLoading, setIsLoading] = useState(
        () => !homeSnapshot?.hasRestorableEvents,
    );
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [offset, setOffset] = useState(() => homeSnapshot?.offset ?? 0);
    const [hasMore, setHasMore] = useState(() => homeSnapshot?.hasMore ?? true);
    const [appliedFilters, setAppliedFilters] = useState<GetListRequest>(
        () => homeSnapshot?.appliedFilters ?? {},
    );
    const [uiFilters, setUiFilters] = useState<FiltersState | null>(
        () => homeSnapshot?.uiFilters ?? null,
    );
    const [availableFilters, setAvailableFilters] = useState<FiltersData | null>(
        () => homeSnapshot?.availableFilters ?? null,
    );
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>(
        () => homeSnapshot?.loadedImages ?? {},
    );
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>(
        () => homeSnapshot?.imageErrors ?? {},
    );
    const lastRequestRef = useRef<{ key: string; time: number } | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isUserInterestsReady, setIsUserInterestsReady] = useState(false);
    const [userProfileCity, setUserProfileCity] = useState<string | null>(null);
    const [isTabOverrideActive, setIsTabOverrideActive] = useState(false);
    const tabOverrideBaseInterestsRef = useRef<string[] | null>(null);
    const restoredFromSessionRef = useRef(
        homeSnapshot?.hasRestorableEvents ?? false,
    );
    const skipNextDebounceRef = useRef(homeSnapshot?.hasRestorableEvents ?? false);
    const defaultUserCityAppliedRef = useRef(false);
    const profileCityNotInFiltersRef = useRef(false);

    const tabs: Array<{ label: string; categories: string[] }> = [
        { label: DEFAULT_HOME_TAB, categories: ['nightlife', 'gastronomic'] },
        { label: 'Начните знакомство с городом', categories: ['excursions'] },
        { label: 'Рядом с вами', categories: ['excursions'] },
        { label: 'Для всей семьи', categories: ['kids_activities'] },
        { label: 'На английском', categories: ['english_language'] },
        { label: 'На родном языке', categories: ['native_language'] },
    ];

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

    // Снимок ленты уже в useState (parseHomeFeedSnapshot). Скролл только после paint:
    // синхронный scrollTo + position:sticky в iOS / Telegram WebView даёт чёрный прямоугольник
    // до следующего тапа; откладываем и повторяем после layout (картинки карточек).
    useEffect(() => {
        if (!homeSnapshot?.hasRestorableEvents) {
            return;
        }
        const y = homeSnapshot.scrollY ?? 0;
        if (y <= 0) {
            return;
        }

        let cancelled = false;
        const apply = () => {
            if (cancelled) {
                return;
            }
            window.scrollTo({ top: y, left: 0, behavior: 'auto' });
        };

        let raf2 = 0;
        const raf1 = window.requestAnimationFrame(() => {
            raf2 = window.requestAnimationFrame(apply);
        });
        const t1 = window.setTimeout(apply, 80);
        const t2 = window.setTimeout(apply, 280);

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(raf1);
            if (raf2) {
                window.cancelAnimationFrame(raf2);
            }
            window.clearTimeout(t1);
            window.clearTimeout(t2);
        };
    }, [homeSnapshot]);

    useEffect(() => {
        setIsInitialized(true);
    }, []);

    // Старт HomePage: категории из /v1/user (info.interests[].code)
    // До инициализации этих категорий первый запрос списка не отправляем.
    useEffect(() => {
        if (!isInitialized) {
            return;
        }
        if (restoredFromSessionRef.current) {
            setIsUserInterestsReady(true);
            return;
        }

        let cancelled = false;
        const loadUserInterests = async () => {
            try {
                const userData = await authService.getCurrentUser();
                if (cancelled) return;
                const trimmedCity = (userData.city || '').trim();
                setUserProfileCity(trimmedCity || null);
                const interestCodes = (userData.interests || []).filter(Boolean);
                if (interestCodes.length > 0) {
                    setAppliedFilters((prev) => ({ ...prev, category: interestCodes }));
                    setUiFilters((prev) => ({
                        cities: prev?.cities || [],
                        districts: prev?.districts || [],
                        priceRange: prev?.priceRange || [availableFilters?.min_price ?? 0, availableFilters?.max_price ?? 10000],
                        dateType: prev?.dateType ?? null,
                        weekdays: prev?.weekdays ?? false,
                        exactDate: prev?.exactDate || '',
                        formats: prev?.formats || [],
                        interests: interestCodes,
                    }));
                }
            } catch {
                // неавторизованный пользователь или ошибка — просто не предзаполняем
            } finally {
                if (!cancelled) setIsUserInterestsReady(true);
            }
        };

        loadUserInterests();
        return () => {
            cancelled = true;
        };
    }, [isInitialized, availableFilters?.min_price, availableFilters?.max_price]);

    // Город из профиля: в запрос и в UI фильтра, если он есть в списке cities с ответа списка
    useEffect(() => {
        if (!isInitialized || !isUserInterestsReady) {
            return;
        }
        if (!userProfileCity) {
            return;
        }
        if (defaultUserCityAppliedRef.current || profileCityNotInFiltersRef.current) {
            return;
        }

        const cities = availableFilters?.cities;
        if (!cities?.length) {
            return;
        }

        if (!cities.includes(userProfileCity)) {
            profileCityNotInFiltersRef.current = true;
            return;
        }

        const hasAnyCitySelected =
            Boolean(appliedFilters.city) || (uiFilters?.cities?.length ?? 0) > 0;
        if (hasAnyCitySelected) {
            defaultUserCityAppliedRef.current = true;
            return;
        }

        defaultUserCityAppliedRef.current = true;
        setAppliedFilters((prev) => ({ ...prev, city: userProfileCity }));
        setUiFilters((prev) => {
            const minP = availableFilters?.min_price ?? 0;
            const maxP = availableFilters?.max_price ?? 10000;
            const base: FiltersState =
                prev ?? {
                    cities: [],
                    districts: [],
                    priceRange: [minP, maxP],
                    dateType: null,
                    weekdays: false,
                    exactDate: '',
                    formats: [],
                    interests: [],
                };
            return {
                ...base,
                cities: [userProfileCity],
            };
        });
    }, [
        isInitialized,
        isUserInterestsReady,
        userProfileCity,
        availableFilters,
        appliedFilters.city,
        uiFilters?.cities,
    ]);

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
            const isFirstTab = activeTab === tabs[0].label;
            const activeTabConfig = tabs.find((tab) => tab.label === activeTab);
            const categoriesFromFilters = appliedFilters.category;
            const categoriesFromTab = isTabOverrideActive ? activeTabConfig?.categories : undefined;
            const shouldUseRandomByTab = isTabOverrideActive && !isFirstTab;
            const params: GetListRequest = {
                q: debouncedSearchQuery || undefined,
                // random только при активном tab-override и не для первой вкладки
                sort: shouldUseRandomByTab ? 'random' : getSortParam(currentSort),
                limit: PAGE_LIMIT,
                offset: nextOffset,
                ...appliedFilters,
                category: categoriesFromTab ?? categoriesFromFilters,
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
    }, [debouncedSearchQuery, currentSort, appliedFilters, activeTab, isTabOverrideActive, isInitialized, isUserInterestsReady]);

    useEffect(() => {
        const handleScroll = () => {
            if (isLoading || isLoadingMore || !hasMore || !isUserInterestsReady) {
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
    }, [offset, hasMore, isLoading, isLoadingMore, debouncedSearchQuery, currentSort, appliedFilters, activeTab, isTabOverrideActive, isUserInterestsReady]);

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
            <div className="home-page-sticky-top">
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
                        key={tab.label}
                        className={`tab-button ${isTabOverrideActive && activeTab === tab.label ? 'active' : ''}`}
                        onClick={() => {
                            // Повторный клик по активному табу снимает tab-фильтр
                            if (isTabOverrideActive && activeTab === tab.label) {
                                setIsTabOverrideActive(false);
                                const baseInterests = tabOverrideBaseInterestsRef.current ?? [];
                                setAppliedFilters((prev) => {
                                    const next = { ...prev };
                                    if (baseInterests.length > 0) {
                                        next.category = baseInterests;
                                    } else {
                                        delete next.category;
                                    }
                                    return next;
                                });
                                setUiFilters((prev) =>
                                    mergeUiFiltersForTabOverride(
                                        prev,
                                        appliedFilters,
                                        availableFilters,
                                        baseInterests,
                                    ),
                                );
                                return;
                            }
                            if (!isTabOverrideActive) {
                                tabOverrideBaseInterestsRef.current = uiFilters?.interests ?? appliedFilters.category ?? [];
                            }
                            setActiveTab(tab.label);
                            setIsTabOverrideActive(true);
                            setAppliedFilters((prev) => ({ ...prev, category: tab.categories }));
                            setUiFilters((prev) =>
                                mergeUiFiltersForTabOverride(
                                    prev,
                                    appliedFilters,
                                    availableFilters,
                                    tab.categories,
                                ),
                            );
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
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
                            onClick={() =>
                                navigate(`/events/${event.id}`, {
                                    state: { from: '/' },
                                })
                            }
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
                                <button
                                    type="button"
                                    className={`favourite-heart ${isFavourite(event.id) ? 'favourite-heart-active' : 'favourite-heart-outline'}`}
                                    onClick={(e) => { e.stopPropagation(); toggleFavourite(event.id); }}
                                    aria-label={isFavourite(event.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                                >
                                    {isFavourite(event.id) ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21" viewBox="0 0 24 21" fill="none">
                                            <path d="M18.1857 1C13.5464 1 13.5464 4.75243 12 4.75243C10.4536 4.75243 10.4536 1 5.81429 1C1.56161 1 0.364775 5.56486 1.2971 9.22077C2.22941 12.8767 8.90714 20 12 20C15.0929 20 21.7706 12.8767 22.7029 9.22077C23.6352 5.56486 22.4384 1 18.1857 1Z" fill="#E94C29" stroke="#E94C29" stroke-width="2" />
                                        </svg>
                                    ) : (

                                        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="21" viewBox="0 0 23 21" fill="none">
                                            <path d="M11.5 4.75243C10.0239 4.75243 10.0239 1 5.59545 1C1.53608 1 0.393649 5.56486 1.28359 9.22078C2.17353 12.8767 8.54773 20 11.5 20" stroke="#414141" stroke-width="2" />
                                            <path d="M11.5 4.75243C12.9761 4.75243 12.9761 1 17.4045 1C21.4639 1 22.6064 5.56486 21.7164 9.22078C20.8265 12.8767 14.4523 20 11.5 20" stroke="#414141" stroke-width="2" />
                                        </svg>

                                    )}

                                </button>
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
                                        <span className="event-price">{event.price <= 0 ? 'Бесплатно' : `${event.price} ${event.currencySymbol}`}</span>
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
                    setIsTabOverrideActive(false);
                    tabOverrideBaseInterestsRef.current = null;
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

