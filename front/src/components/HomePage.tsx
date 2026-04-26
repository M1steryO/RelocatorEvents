import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsService } from '../services/eventsService';
import type { Event as ServerEvent, GetListRequest, FiltersData } from '../services/eventsService';
import { FiltersModal, type FiltersState } from './FiltersModal';
import { SortModal } from './SortModal';
import { NotFoundCard } from './NotFoundCard';
import { useFavourites } from '../contexts/FavouritesContext';
import { useAuth } from '../contexts/AuthContext';
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

type CollectionConfig = {
    label: string;
    categories?: string[];
    lang?: string;
    freeOnly?: boolean;
};

const DEFAULT_HOME_TAB = 'Для вас';
const COLLECTIONS: CollectionConfig[] = [
    { label: DEFAULT_HOME_TAB },
    { label: 'Вечер для новых друзей', categories: ['nightlife', 'gastronomic'] },
    { label: 'Знакомство с городом', categories: ['excursion'] },
    { label: 'Для всей семьи', categories: ['kids'] },
    { label: 'На английском', lang: 'en' },
    { label: 'На родном языке', lang: 'ru' },
    { label: 'Бесплатные мероприятия', freeOnly: true },
];

const getSelectedCityForCollections = (
    ui: FiltersState | null,
    applied: GetListRequest,
): string | null => {
    const fromUi = (ui?.cities?.[0] || '').trim();
    if (fromUi) return fromUi;
    const fromApplied = (applied.city || '').trim();
    return fromApplied || null;
};

const buildCityOnlyUiFilters = (
    city: string | null,
    available: FiltersData | null,
): FiltersState => ({
    cities: city ? [city] : [],
    districts: [],
    priceRange: [available?.min_price ?? 0, available?.max_price ?? 10000],
    dateType: null,
    weekdays: false,
    exactDate: '',
    formats: [],
    interests: [],
    languages: [],
});

function feedRequestKey(parts: {
    debouncedSearchQuery: string;
    activeTab: string;
    isTabOverrideActive: boolean;
    appliedFilters: GetListRequest;
}): string {
    return JSON.stringify({
        q: parts.debouncedSearchQuery,
        tab: parts.activeTab,
        tabOverride: parts.isTabOverrideActive,
        filters: parts.appliedFilters,
    });
}

type StoredHomeFeedRaw = {
    didLoad?: boolean;
    searchQuery?: string;
    debouncedSearchQuery?: string;
    activeTab?: string;
    isTabOverrideActive?: boolean;
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
    appliedFilters: GetListRequest;
    uiFilters: FiltersState | null;
    availableFilters: FiltersData | null;
    loadedImages: Record<number, boolean>;
    imageErrors: Record<number, boolean>;
    isTabOverrideActive: boolean;
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
            appliedFilters: state.appliedFilters ?? {},
            uiFilters: state.uiFilters ?? null,
            availableFilters: state.availableFilters ?? null,
            loadedImages: state.loadedImages ?? {},
            imageErrors: state.imageErrors ?? {},
            isTabOverrideActive: Boolean(state.isTabOverrideActive),
        };
    } catch (error) {
        console.error('Failed to parse home feed snapshot:', error);
        return null;
    }
}

export const HomePage = () => {
    const navigate = useNavigate();
    const { isFavourite, toggleFavourite } = useFavourites();
    const { user } = useAuth();
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
    const [isTabOverrideActive, setIsTabOverrideActive] = useState(
        () => homeSnapshot?.isTabOverrideActive ?? false,
    );
    const restoredFromSessionRef = useRef(
        homeSnapshot?.hasRestorableEvents ?? false,
    );
    const skipNextDebounceRef = useRef(homeSnapshot?.hasRestorableEvents ?? false);
    /** Пока ключ совпадает с восстановленным — не дёргаем список заново (возврат с карточки). */
    const keepRestoredFeedRef = useRef(homeSnapshot?.hasRestorableEvents ?? false);
    const restoredFeedRequestKeyRef = useRef<string | null>(
        homeSnapshot?.hasRestorableEvents
            ? feedRequestKey({
                  debouncedSearchQuery: homeSnapshot.debouncedSearchQuery,
                  activeTab: homeSnapshot.activeTab,
                  isTabOverrideActive: homeSnapshot.isTabOverrideActive,
                  appliedFilters: homeSnapshot.appliedFilters,
              })
            : null,
    );
    const latestScrollYRef = useRef(0);
    /** После таба/фильтра/сортировки/поиска не применять scrollY из снимка (эффекты по events.length и таймеры). */
    const invalidateRestoredScrollRef = useRef(false);
    const restoredScrollYRef = useRef(homeSnapshot?.scrollY ?? 0);
    const shouldCancelRestoreOnUserScrollRef = useRef(
        homeSnapshot?.hasRestorableEvents ?? false,
    );
    const isProgrammaticRestoreScrollRef = useRef(false);

    const applyRestoredScroll = useCallback((y: number) => {
        if (invalidateRestoredScrollRef.current) {
            return;
        }
        isProgrammaticRestoreScrollRef.current = true;
        window.scrollTo({ top: y, left: 0, behavior: 'auto' });
        // Keep programmatic flag for a short moment to ignore own scroll events.
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                isProgrammaticRestoreScrollRef.current = false;
            });
        });
    }, []);

    const scrollFeedToTop = useCallback(() => {
        invalidateRestoredScrollRef.current = true;
        latestScrollYRef.current = 0;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, []);

    const defaultUserCityAppliedRef = useRef(false);
    const profileCityNotInFiltersRef = useRef(false);

    const selectedCollection = useMemo(
        () => COLLECTIONS.find((collection) => collection.label === activeTab) ?? COLLECTIONS[0],
        [activeTab],
    );

    // Снимок ленты уже в useState (parseHomeFeedSnapshot). Скролл только после paint:
    // синхронный scrollTo + position:sticky в iOS / Telegram WebView даёт чёрный прямоугольник
    // до следующего тапа; откладываем и повторяем после layout (картинки карточек).
    useEffect(() => {
        if (!homeSnapshot?.hasRestorableEvents) {
            return;
        }
        if (invalidateRestoredScrollRef.current) {
            return;
        }
        const y = homeSnapshot.scrollY ?? 0;
        if (y <= 0) {
            return;
        }

        let cancelled = false;
        const apply = () => {
            if (cancelled || invalidateRestoredScrollRef.current) {
                return;
            }
            applyRestoredScroll(y);
        };

        let raf2 = 0;
        const raf1 = window.requestAnimationFrame(() => {
            raf2 = window.requestAnimationFrame(apply);
        });
        const t1 = window.setTimeout(apply, 80);
        const t2 = window.setTimeout(apply, 240);
        const t3 = window.setTimeout(apply, 420);

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(raf1);
            if (raf2) {
                window.cancelAnimationFrame(raf2);
            }
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.clearTimeout(t3);
        };
    }, [homeSnapshot, applyRestoredScroll]);

    // После раскладки карточек — повторить скролл из снимка (только если пользователь не сбросил ленту табом/фильтром и т.д.)
    useEffect(() => {
        if (invalidateRestoredScrollRef.current) {
            return;
        }
        if (!homeSnapshot?.hasRestorableEvents) {
            return;
        }
        const y = homeSnapshot.scrollY ?? 0;
        if (y <= 0 || events.length === 0) {
            return;
        }
        const id = window.requestAnimationFrame(() => {
            if (invalidateRestoredScrollRef.current) {
                return;
            }
            applyRestoredScroll(y);
        });
        return () => window.cancelAnimationFrame(id);
    }, [events.length, homeSnapshot, applyRestoredScroll]);

    useEffect(() => {
        const onScroll = () => {
            latestScrollYRef.current = window.scrollY;
            if (
                shouldCancelRestoreOnUserScrollRef.current &&
                !isProgrammaticRestoreScrollRef.current &&
                !invalidateRestoredScrollRef.current &&
                Math.abs(window.scrollY - restoredScrollYRef.current) > 8
            ) {
                // User scrolled manually after restore start:
                // stop further delayed auto-restores to avoid visible jumps.
                invalidateRestoredScrollRef.current = true;
                shouldCancelRestoreOnUserScrollRef.current = false;
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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

        const trimmedCity = (user?.city || '').trim();
        const interestCodes = (user?.interests || []).filter(Boolean);

        setUserProfileCity(trimmedCity || null);
        if (trimmedCity) {
            defaultUserCityAppliedRef.current = true;
        }

        setAppliedFilters((prev) => {
            let changed = false;
            let next = prev;

            if (trimmedCity && prev.city !== trimmedCity) {
                next = { ...next, city: trimmedCity };
                changed = true;
            }

            if (interestCodes.length > 0) {
                const prevCategories = Array.isArray(prev.category) ? prev.category : [];
                const isSameCategories =
                    prevCategories.length === interestCodes.length &&
                    prevCategories.every((code, index) => code === interestCodes[index]);

                if (!isSameCategories) {
                    next = changed ? next : { ...next };
                    next.category = interestCodes;
                    changed = true;
                }
            }

            return changed ? next : prev;
        });

        setUiFilters((prev) => {
            const base: FiltersState =
                prev ?? {
                    cities: [],
                    districts: [],
                    priceRange: [0, 10000],
                    dateType: null,
                    weekdays: false,
                    exactDate: '',
                    formats: [],
                    interests: [],
                    languages: [],
                };

            return {
                ...base,
                cities: trimmedCity ? [trimmedCity] : base.cities,
                interests: interestCodes.length > 0 ? interestCodes : base.interests,
            };
        });

        setIsUserInterestsReady(true);
    }, [isInitialized, user?.city, user?.interests]);

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
                    languages: [],
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
            setDebouncedSearchQuery((prev) => {
                if (prev !== searchQuery) {
                    queueMicrotask(scrollFeedToTop);
                }
                return searchQuery;
            });
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, isInitialized, scrollFeedToTop]);

    const fetchEventsPage = async (nextOffset: number, replace: boolean) => {
        if (replace) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const categoriesFromFilters = appliedFilters.category;
            const categoriesFromCollection = isTabOverrideActive ? selectedCollection.categories : undefined;
            const langFromCollection = isTabOverrideActive ? selectedCollection.lang : undefined;
            const freeOnlyFromCollection = isTabOverrideActive && selectedCollection.freeOnly === true;
            const params: GetListRequest = {
                q: debouncedSearchQuery || undefined,
                limit: PAGE_LIMIT,
                offset: nextOffset,
                ...appliedFilters,
                category: langFromCollection || freeOnlyFromCollection ? undefined : (categoriesFromCollection ?? categoriesFromFilters),
                lang: langFromCollection ?? appliedFilters.lang,
                min_price: freeOnlyFromCollection ? 0 : appliedFilters.min_price,
                max_price: freeOnlyFromCollection ? 0 : appliedFilters.max_price,
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
        if (!isInitialized || !isUserInterestsReady) {
            return;
        }

        const key = feedRequestKey({
            debouncedSearchQuery,
            activeTab,
            isTabOverrideActive,
            appliedFilters,
        });

        if (keepRestoredFeedRef.current) {
            if (restoredFeedRequestKeyRef.current === key) {
                return;
            }
            keepRestoredFeedRef.current = false;
        }

        lastRequestRef.current = null;
        setOffset(0);
        setHasMore(true);
        fetchEventsPage(0, true);
    }, [debouncedSearchQuery, appliedFilters, activeTab, isTabOverrideActive, isInitialized, isUserInterestsReady]);

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
    }, [offset, hasMore, isLoading, isLoadingMore, debouncedSearchQuery, appliedFilters, activeTab, isTabOverrideActive, isUserInterestsReady]);

    // Сохраняем состояние ленты и позицию скролла при размонтировании
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        return () => {
            try {
                const scrollY = Math.max(
                    window.scrollY,
                    latestScrollYRef.current,
                );
                const state = {
                    didLoad: true,
                    searchQuery,
                    debouncedSearchQuery,
                    activeTab,
                    isTabOverrideActive,
                    events,
                    offset,
                    hasMore,
                    appliedFilters,
                    uiFilters,
                    availableFilters,
                    loadedImages,
                    imageErrors,
                    scrollY,
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
        events,
        offset,
        hasMore,
        appliedFilters,
        availableFilters,
        uiFilters,
        loadedImages,
        imageErrors,
        isTabOverrideActive,
    ]);

    const handleImageLoad = (id: number) => {
        setLoadedImages(prev => ({ ...prev, [id]: true }));
        setImageErrors(prev => ({ ...prev, [id]: false }));
    };

    const handleImageError = (id: number) => {
        setImageErrors(prev => ({ ...prev, [id]: true }));
    };

    const minPriceDefault = availableFilters?.min_price ?? 0;
    const maxPriceDefault = availableFilters?.max_price ?? 10000;
    const hasAnyManualFilterApplied = Boolean(
        uiFilters && (
            uiFilters.cities.length > 0 ||
            uiFilters.districts.length > 0 ||
            uiFilters.formats.length > 0 ||
            uiFilters.interests.length > 0 ||
            uiFilters.languages.length > 0 ||
            uiFilters.dateType ||
            uiFilters.exactDate ||
            uiFilters.priceRange[0] !== minPriceDefault ||
            uiFilters.priceRange[1] !== maxPriceDefault
        ),
    );
    const isCollectionButtonActive =
        isTabOverrideActive && selectedCollection.label !== DEFAULT_HOME_TAB;

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
                            placeholder="Поиск"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        className={`action-button selection-button ${isCollectionButtonActive ? 'active' : ''}`}
                        onClick={() => setIsSortOpen(true)}
                    >
                        Подборки
                        <svg width="26" height="19" viewBox="0 0 26 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.36377 1C8.36377 0.447715 7.91605 0 7.36377 0C6.81148 0 6.36377 0.447715 6.36377 1H7.36377H8.36377ZM6.65666 18.7071C7.04719 19.0976 7.68035 19.0976 8.07088 18.7071L14.4348 12.3431C14.8254 11.9526 14.8254 11.3195 14.4348 10.9289C14.0443 10.5384 13.4111 10.5384 13.0206 10.9289L7.36377 16.5858L1.70692 10.9289C1.31639 10.5384 0.683226 10.5384 0.292702 10.9289C-0.0978227 11.3195 -0.0978227 11.9526 0.292702 12.3431L6.65666 18.7071ZM17.3638 18C17.3638 18.5523 17.8115 19 18.3638 19C18.9161 19 19.3638 18.5523 19.3638 18H18.3638H17.3638ZM19.0709 0.292893C18.6804 -0.0976311 18.0472 -0.0976311 17.6567 0.292893L11.2927 6.65685C10.9022 7.04738 10.9022 7.68054 11.2927 8.07107C11.6832 8.46159 12.3164 8.46159 12.7069 8.07107L18.3638 2.41421L24.0206 8.07107C24.4111 8.46159 25.0443 8.46159 25.4348 8.07107C25.8254 7.68054 25.8254 7.04738 25.4348 6.65685L19.0709 0.292893ZM7.36377 1H6.36377V18H7.36377H8.36377V1H7.36377ZM18.3638 18H19.3638L19.3638 1L18.3638 1L17.3638 1L17.3638 18H18.3638Z" fill="#458DBD" />
                        </svg>
                    </button>
                    <button
                        className={`action-button filter-button ${hasAnyManualFilterApplied ? 'active' : ''}`}
                        onClick={() => setIsFiltersOpen(true)}
                    >
                        Фильтр
                        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.094 8.46189V13.3346C7.094 13.9609 7.34195 14.5619 7.78399 15.007L10.5368 17.7791C11.0045 18.2501 11.8099 17.9176 11.8065 17.255L11.7607 8.46972C11.7597 8.26984 11.8398 8.07805 11.983 7.93803L17.7792 2.26752C18.2534 1.80358 17.9238 1 17.2593 1H1.74659C1.08666 1 0.754953 1.7941 1.21992 2.26083L6.87849 7.94074C7.01653 8.0793 7.094 8.26664 7.094 8.46189Z" stroke="#458DBD" strokeWidth="2" />
                        </svg>
                    </button>
                </div>
                <div className="selected-collection-title">{selectedCollection.label}</div>
            </header>
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
                    scrollFeedToTop();
                    setIsTabOverrideActive(false);
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
                    if (filters.languages.length > 0) {
                        apiFilters.lang = filters.languages[0];
                    }

                    setAppliedFilters(apiFilters);
                }}
            />

            {/* Sort Modal */}
            <SortModal
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                title="Подборки"
                options={COLLECTIONS.map((collection) => ({
                    value: collection.label,
                    label: collection.label,
                }))}
                currentSelection={selectedCollection.label}
                onApply={(collectionLabel) => {
                    scrollFeedToTop();
                    const preservedCity = getSelectedCityForCollections(uiFilters, appliedFilters);
                    const cityOnlyUi = buildCityOnlyUiFilters(preservedCity, availableFilters);
                    const selected = COLLECTIONS.find((collection) => collection.label === collectionLabel) || COLLECTIONS[0];
                    if (selected.label === DEFAULT_HOME_TAB) {
                        setActiveTab(DEFAULT_HOME_TAB);
                        setIsTabOverrideActive(false);
                        setAppliedFilters(preservedCity ? { city: preservedCity } : {});
                        setUiFilters(cityOnlyUi);
                        return;
                    }
                    setActiveTab(selected.label);
                    setIsTabOverrideActive(true);
                    const nextFilters: GetListRequest = preservedCity ? { city: preservedCity } : {};
                    if (selected.lang) {
                        nextFilters.lang = selected.lang;
                    } else if (selected.freeOnly) {
                        nextFilters.min_price = 0;
                        nextFilters.max_price = 0;
                    } else if (selected.categories?.length) {
                        nextFilters.category = selected.categories;
                    }
                    setAppliedFilters(nextFilters);
                    setUiFilters(cityOnlyUi);
                }}
            />
        </div>
    );
};

