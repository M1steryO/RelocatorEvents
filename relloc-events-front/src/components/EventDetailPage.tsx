import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsService } from '../services/eventsService';
import type { Event, Address } from '../services/eventsService';
import { NotFoundCard } from './NotFoundCard';
import './EventDetailPage.css';

let yandexMapsPromise: Promise<any> | null = null;

const loadYandexMaps = (): Promise<any> => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Window is not available'));
    }

    const ymaps = (window as any).ymaps;
    if (ymaps) {
        return new Promise(resolve => {
            ymaps.ready(() => resolve(ymaps));
        });
    }

    if (yandexMapsPromise) {
        return yandexMapsPromise;
    }

    yandexMapsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
        script.async = true;
        script.onload = () => {
            const loadedYmaps = (window as any).ymaps;
            if (!loadedYmaps) {
                reject(new Error('Yandex Maps failed to load'));
                return;
            }
            loadedYmaps.ready(() => resolve(loadedYmaps));
        };
        script.onerror = () => reject(new Error('Failed to load Yandex Maps script'));
        document.head.appendChild(script);
    });

    return yandexMapsPromise;
};

const formatDate = (timestamp?: string): { date: string; time: string; fullDate: string; shortDate: string } => {
    if (!timestamp) {
        return { date: '', time: '', fullDate: '', shortDate: '' };
    }

    try {
        const date = new Date(timestamp);
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];

        const day = date.getDate();
        const month = months[date.getMonth()];
        const monthUpper = month.toUpperCase();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return {
            date: `${day} ${month}`,
            time: `${hours}:${minutes}`,
            fullDate: `${day} ${monthUpper}, ${hours}:${minutes}`,
            shortDate: `${day}.${String(date.getMonth() + 1).padStart(2, '0')}`
        };
    } catch (error) {
        console.error('Error parsing date:', error);
        return { date: '', time: '', fullDate: '', shortDate: '' };
    }
};

export const EventDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [address, setAddress] = useState<Address | undefined>(undefined);
    const [venueName, setVenueName] = useState<string | undefined>(undefined);
    const [fullAddress, setFullAddress] = useState<string | undefined>(undefined);
    const [city, setCity] = useState<string | undefined>(undefined);
    const [district, setDistrict] = useState<string | undefined>(undefined);
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPosterLoaded, setIsPosterLoaded] = useState(false);
    const [isPosterError, setIsPosterError] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const placemarkRef = useRef<any>(null);

    const eventId = id;
    const lastLoadedEventRef = useRef<string | null>(null);
    const handleOpenReviews = () => {
        if (!eventId) return;
        navigate(`/events/${eventId}/reviews`);
    };

    useEffect(() => {
        const loadEvent = async () => {
            if (!eventId) {
                setError('ID мероприятия не указан');
                setIsLoading(false);
                return;
            }

            if (lastLoadedEventRef.current === eventId) {
                return;
            }
            lastLoadedEventRef.current = eventId;

            setIsLoading(true);
            setError(null);

            try {
                const response = await eventsService.getEvent(Number(eventId));
                setEvent(response.event);
                setIsPosterLoaded(false);
                setIsPosterError(false);

                // Адрес всегда внутри event.address
                if (response.event.address) {
                    setAddress(response.event.address);
                    setVenueName(response.event.address.venue_name);
                    setFullAddress(response.event.address.fullAddress);
                    setCity(response.event.address.city);
                    setDistrict(response.event.address.district);
                    setLatitude(response.event.address.latitude);
                    setLongitude(response.event.address.longitude);
                }
            } catch (err) {
                console.error('Failed to load event:', err);
                setError('Не удалось загрузить мероприятие');
            } finally {
                setIsLoading(false);
            }
        };

        loadEvent();
    }, [eventId]);

    useEffect(() => {
        if (latitude === undefined || longitude === undefined) return;

        let isCancelled = false;

        loadYandexMaps()
            .then((ymaps) => {
                if (isCancelled || !mapContainerRef.current) return;

                const coords = [latitude, longitude];

                if (!mapInstanceRef.current) {
                    mapInstanceRef.current = new ymaps.Map(mapContainerRef.current, {
                        center: coords,
                        zoom: 15,
                        controls: ['zoomControl'],
                    });
                    placemarkRef.current = new ymaps.Placemark(coords);
                    mapInstanceRef.current.geoObjects.add(placemarkRef.current);
                } else {
                    mapInstanceRef.current.setCenter(coords, 15);
                    if (placemarkRef.current?.geometry) {
                        placemarkRef.current.geometry.setCoordinates(coords);
                    } else {
                        placemarkRef.current = new ymaps.Placemark(coords);
                        mapInstanceRef.current.geoObjects.add(placemarkRef.current);
                    }
                }
            })
            .catch((mapError) => {
                console.error('Failed to initialize Yandex map:', mapError);
            });

        return () => {
            isCancelled = true;
        };
    }, [latitude, longitude]);

    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
                placemarkRef.current = null;
            }
        };
    }, []);

    const handleBack = () => {
        navigate(-1);
    };

    if (isLoading) {
        return (
            <div className="event-detail-page">
                <div className="event-detail-loader">
                    <div className="loader-spinner"></div>
                    <p>Загрузка мероприятия...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="event-detail-page event-detail-not-found">
                <NotFoundCard title="404" subtitle="Мероприятие не найдено" />
            </div>
        );
    }

    const { date, time, fullDate, shortDate } = formatDate(event.starts_at);
    const eventDate = date ? `${date}, ${time}` : '';
    const formattedDate = fullDate || eventDate;
    const posterDate = shortDate && time ? `${shortDate} / ${venueName || 'Место уточняется'} / ${time}` : '';

    // Определяем категорию для баннера (можно расширить логику)


    return (
        <div className="event-detail-page">
            {/* Main Event Poster Section */}
            <div className="event-poster-section">
                {/* Header with back button and category banner - наложен на изображение */}
                <header className="event-detail-header">
                    <button className="event-back-button" onClick={handleBack}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16" fill="none">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.3472 15.7474C7.75996 15.3804 7.7971 14.7484 7.43015 14.3356L2.35344 8.62504C2.17578 8.42519 2.0813 8.31784 2.01899 8.23557C2.01681 8.2327 2.01476 8.22996 2.01282 8.22735C2.01467 8.22467 2.01662 8.22186 2.01869 8.21892C2.07806 8.13449 2.16867 8.02386 2.33914 7.81784L7.45322 1.63754C7.80531 1.21204 7.7458 0.581678 7.32031 0.229585C6.89481 -0.122506 6.26444 -0.0629985 5.91235 0.362501L0.779368 6.56565C0.635262 6.73975 0.492836 6.91183 0.382621 7.06858C0.260039 7.24293 0.132862 7.45826 0.0631174 7.72947C-0.0268922 8.0795 -0.0203743 8.44737 0.0819781 8.79398C0.161286 9.06256 0.296011 9.27325 0.424693 9.44314C0.540388 9.59588 0.688816 9.7628 0.838995 9.93169C0.845564 9.93908 0.852137 9.94647 0.85871 9.95386L5.93542 15.6644C6.30236 16.0772 6.93444 16.1143 7.3472 15.7474Z" fill="#414141" />
                        </svg>
                    </button>
                    <div className="event-category-banner">
                        {event.title}
                    </div>
                </header>
                <div className={`event-poster-image ${isPosterLoaded && !isPosterError ? 'loaded' : 'loading'}`}>
                    <img
                        className="event-poster-img"
                        src={event.image_url || '/event-no-img.png'}
                        alt={event.title}
                        onLoad={() => {
                            setIsPosterLoaded(true);
                            setIsPosterError(false);
                        }}
                        onError={() => {
                            setIsPosterLoaded(false);
                            setIsPosterError(true);
                        }}
                    />
                </div>

            </div>

            {/* Registration Button */}
            <div className="event-registration-section">
                {event.link ? (
                    <a
                        className="event-registration-button"
                        href={event.link}
                        target="_blank"
                        rel="noreferrer"
                    >
                        РЕГИСТРАЦИЯ
                    </a>
                ) : (
                    <button className="event-registration-button" disabled>
                        РЕГИСТРАЦИЯ
                    </button>
                )}
            </div>

            {/* Info Chips */}
            <div className="event-info-chips">

                <button
                    className="event-info-chip event-info-chip-button"
                    onClick={handleOpenReviews}
                    type="button"
                >
                    {event.rating !== null && (
                        <div className="chip-value">{event.rating?.toFixed(1).replace('.', ',')}</div>
                    )}

                    <div className="chip-label-container">
                        <div className="chip-label">
                            {event.reviews_count || 0} ОТЗЫВОВ
                        </div>
                        <div className="chip-label">
                            {event.ratings_count || 0} ОЦЕНИЛИ
                        </div>
                    </div>

                </button>
                {event.min_age !== null && (
                    <div className="event-info-chip">
                        <div className="chip-label-container">
                            <div className="chip-label">ВОЗРАСТ</div>
                            <div className="chip-label">{event.min_age}+</div>
                        </div>
                    </div>
                )}
                {event.seats_available !== null && (
                    <div className="event-info-chip">
                        <div className="chip-label-container">
                            <div className="chip-label">МЕСТА</div>
                            <div className="chip-label">{event.seats_available}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Description Block */}
            {event.description && (
                <div className={`event-description-block ${isDescriptionExpanded ? 'expanded' : ''}`}>
                    <div className="event-description-text">{event.description}</div>
                    <button
                        type="button"
                        className="event-description-toggle"
                        onClick={() => setIsDescriptionExpanded(prev => !prev)}
                    >
                        {isDescriptionExpanded ? 'Свернуть' : 'Показать полностью'}
                    </button>
                </div>
            )}

            {/* Event Details Section */}
            <div className="event-details-section">
                <div className="event-detail-row">
                    <div className="event-detail-label">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 2C4.9 2 4 2.9 4 4V16C4 17.1 4.9 18 6 18H14C15.1 18 16 17.1 16 16V4C16 2.9 15.1 2 14 2H6ZM6 4H14V16H6V4ZM7 6V8H13V6H7ZM7 10V12H13V10H7Z" fill="#FF8C00" />
                        </svg>
                        ДАТА
                    </div>
                    <div className="event-detail-value">{formattedDate}</div>
                </div>
                <div className="event-detail-row">
                    <div className="event-detail-label">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 2C6.48 2 3.5 4.98 3.5 8.5C3.5 13.28 10 18 10 18C10 18 16.5 13.28 16.5 8.5C16.5 4.98 13.52 2 10 2ZM10 11.25C8.21 11.25 6.75 9.79 6.75 8C6.75 6.21 8.21 4.75 10 4.75C11.79 4.75 13.25 6.21 13.25 8C13.25 9.79 11.79 11.25 10 11.25Z" fill="#FF8C00" />
                        </svg>
                        АДРЕС
                    </div>
                    <div className="event-detail-value">{fullAddress || event.link || 'Адрес уточняется'}</div>
                </div>
            </div>

            {/* Venue Name */}
            {venueName && (
                <div className="event-venue-name">
                    <h2>{venueName}</h2>
                </div>
            )}

            {/* Map Section */}
            <div className="event-map-section">
                {latitude !== undefined && longitude !== undefined ? (
                    <div className="event-map" ref={mapContainerRef} />
                ) : (
                    <div className="event-map-placeholder">
                        <p>Адрес уточняется</p>
                    </div>
                )}
            </div>

            {/* Recommendations Section */}
            <div className="event-recommendations-section">
                <h2 className="recommendations-title">ДЛЯ ВАС</h2>
                <div className="recommendations-list">
                    {/* Здесь можно добавить список рекомендаций */}
                    <p className="recommendations-placeholder">Рекомендации появятся здесь</p>
                </div>
            </div>
        </div>
    );
};

