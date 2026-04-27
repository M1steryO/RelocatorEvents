import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favouritesService, type FavouriteEvent } from '../services/favouritesService';
import { useFavourites } from '../contexts/FavouritesContext';
import './FavouritesPage.css';
import './HomePage.css';

const formatDate = (timestamp?: string): { date: string; time: string } => {
    if (!timestamp) return { date: '', time: '' };
    try {
        const numTimestamp = Number(timestamp);
        let date: Date;
        if (!isNaN(numTimestamp)) {
            date = new Date(numTimestamp > 1000000000000 ? numTimestamp : numTimestamp * 1000);
        } else {
            date = new Date(timestamp);
        }
        if (isNaN(date.getTime())) return { date: '', time: '' };
        const day = date.getDate();
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const month = months[date.getMonth()];
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return { date: `${day} ${month}`, time: `${hours}:${minutes}` };
    } catch {
        return { date: '', time: '' };
    }
};

const getCurrencySymbol = (currency?: string): string => {
    if (!currency) return '₽';
    const normalized = currency.toUpperCase();
    const symbols: Record<string, string> = { USD: '$', GEL: '₾', EUR: '€', RUB: '₽' };
    return symbols[normalized] || currency;
};

interface DisplayEvent {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
    rating: number;
    price: number;
    currencySymbol: string;
    image: string;
    link?: string;
}

const toDisplayEvent = (e: FavouriteEvent): DisplayEvent => {
    const { date, time } = formatDate(e.starts_at);
    return {
        id: e.id,
        title: e.title ?? '',
        description: e.description ?? '',
        date,
        time,
        rating: e.rating ?? 0,
        price: e.min_price ?? 0,
        currencySymbol: getCurrencySymbol(e.currency),
        image: e.image_url || '/event-no-img.png',
        link: e.link,
    };
};

type OrganizerModalState = { type: 'buy' | 'register'; link: string } | null;

export const FavouritesPage = () => {
    const navigate = useNavigate();
    const { removeFavourite, syncFavouriteIds } = useFavourites();
    const [events, setEvents] = useState<DisplayEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [organizerModal, setOrganizerModal] = useState<OrganizerModalState>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const list = await favouritesService.listFavourites();
                if (!cancelled) {
                    setEvents(list.map(toDisplayEvent));
                    syncFavouriteIds(list.map((e) => e.id));
                }
            } catch {
                if (!cancelled) setEvents([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const handleRemoveFavourite = async (e: React.MouseEvent, eventId: number) => {
        e.stopPropagation();
        try {
            await removeFavourite(eventId);
            setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
        } catch {
            // notification already in service
        }
    };

    const openOrganizerModal = (e: React.MouseEvent, event: DisplayEvent) => {
        e.stopPropagation();
        if (event.link) {
            setOrganizerModal({
                type: event.price <= 0 ? 'register' : 'buy',
                link: event.link,
            });
        }
    };

    return (
        <div className="favourites-page">
            <header className="favourites-header">
                <button type="button" className="favourites-back" onClick={() => navigate(-1)} aria-label="Назад">
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M7.3472 15.7474C7.75996 15.3804 7.7971 14.7484 7.43015 14.3356L2.35344 8.62504C2.17578 8.42519 2.0813 8.31784 2.01899 8.23557C2.01681 8.2327 2.01476 8.22996 2.01282 8.22735C2.01467 8.22467 2.01662 8.22186 2.01869 8.21892C2.07806 8.13449 2.16867 8.02386 2.33914 7.81784L7.45322 1.63754C7.80531 1.21204 7.7458 0.581678 7.32031 0.229585C6.89481 -0.122506 6.26444 -0.0629985 5.91235 0.362501L0.779368 6.56565C0.635262 6.73975 0.492836 6.91183 0.382621 7.06858C0.260039 7.24293 0.132862 7.45826 0.0631174 7.72947C-0.0268922 8.0795 -0.0203743 8.44737 0.0819781 8.79398C0.161286 9.06256 0.296011 9.27325 0.424693 9.44314C0.540388 9.59588 0.688816 9.7628 0.838995 9.93169L5.93542 15.6644C6.30236 16.0772 6.93444 16.1143 7.3472 15.7474Z" fill="#414141" />
                    </svg>
                </button>
                <h1 className="favourites-title">Избранное</h1>
                <span />
            </header>

            <main className={`favourites-feed ${isLoading ? 'loading' : ''} ${!isLoading && events.length === 0 ? 'favourites-feed-empty' : ''}`}>
                {isLoading ? (
                    <div className="events-loader">
                        <div className="loader-spinner" />
                        <p>Загрузка...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="favourites-empty">
                        <p className="favourites-empty-text">В избранном пока ничего нет</p>
                        <p className="favourites-empty-hint">Добавляйте мероприятия нажатием на сердечко и они появятся здесь</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div
                            key={event.id}
                            className="event-card"
                            onClick={() =>
                                navigate(`/events/${event.id}`, {
                                    state: {
                                        from: '/favourites',
                                        transition: 'event-forward',
                                    },
                                })
                            }
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="event-image-container">
                                <img src={event.image} alt={event.title} className="event-image" />
                                <button
                                    type="button"
                                    className="favourite-heart favourite-heart-active"
                                    onClick={(e) => handleRemoveFavourite(e, event.id)}
                                    aria-label="Удалить из избранного"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21" viewBox="0 0 24 21" fill="none">
                                        <path d="M18.1857 1C13.5464 1 13.5464 4.75243 12 4.75243C10.4536 4.75243 10.4536 1 5.81429 1C1.56161 1 0.364775 5.56486 1.2971 9.22077C2.22941 12.8767 8.90714 20 12 20C15.0929 20 21.7706 12.8767 22.7029 9.22077C23.6352 5.56486 22.4384 1 18.1857 1Z" fill="#E94C29" stroke="#E94C29" stroke-width="2" />
                                    </svg>
                                </button>
                            </div>
                            <div className="event-content">
                                <h3 className="event-title">{event.title}</h3>
                                <div className="event-footer-container">
                                    <div className="event-date-time">
                                        {event.date} {event.time && `| ${event.time}`}
                                    </div>
                                    <div className="event-footer">
                                        {event.rating > 0 && (
                                            <span className="event-rating">{event.rating.toFixed(1).replace('.', ',')} ★</span>
                                        )}
                                        <span className="event-price">{event.price <= 0 ? 'Бесплатно' : `${event.price} ${event.currencySymbol}`}</span>
                                    </div>
                                </div>
                                {event.link && (
                                    <div className="favourites-card-cta-wrap">
                                        <button
                                            type="button"
                                            className="organizer-modal-cta-btn"
                                            onClick={(ev) => openOrganizerModal(ev, event)}
                                        >
                                            <span className="organizer-modal-cta">
                                                {event.price <= 0 ? 'Зарегистрироваться' : `Купить от ${event.price} ${event.currencySymbol}`}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Organizer redirect modal — как на странице мероприятия */}
            {organizerModal && (
                <div className="organizer-modal-overlay" onClick={() => setOrganizerModal(null)}>
                    <div className="organizer-modal" onClick={e => e.stopPropagation()}>
                        <div className="organaizer-modal-header">
                            <p className="organizer-modal-title">
                                {organizerModal.type === 'register'
                                    ? 'Чтобы зарегистрироваться на мероприятие необходимо перейти на сайт организатора'
                                    : 'Чтобы купить билет на мероприятие необходимо перейти на сайт организатора'}
                            </p>
                            <button
                                type="button"
                                className="organizer-modal-close"
                                onClick={() => setOrganizerModal(null)}
                                aria-label="Закрыть"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <rect width="32" height="32" rx="16" fill="#414141" />
                                    <path d="M9 9L23 23M23 9L9 23" stroke="#FAF9F6" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <p className="organizer-modal-disclaimer">
                            ВСЕ ССЫЛКИ БЕЗОПАСНЫ И ПРЕДОСТАВЛЯЮТСЯ ПРОВЕРЕННЫМИ ИСТОЧНИКАМИ
                        </p>
                        <button className="organizer-modal-cta-btn">
                            <a
                                className="organizer-modal-cta"
                                href={organizerModal.link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setOrganizerModal(null)}
                            >
                                {organizerModal.type === 'register' ? 'Перейти к регистрации' : 'Перейти к покупке'}
                            </a>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
