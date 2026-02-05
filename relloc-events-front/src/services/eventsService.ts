import { showGlobalNotification } from '../contexts/NotificationContext';
import { notifyServiceUnavailable } from '../utils/serviceUnavailable';
import { addTelegramInitDataHeader } from '../utils/telegramInitData';
import { notifyUnauthorized } from '../utils/unauthorized';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    || import.meta.env.VITE_EVENTS_API_BASE_URL
    || 'http://localhost:50043';

export const EventType = {
    OFFLINE: 0,
    ONLINE: 1,
} as const;

export type EventType = typeof EventType[keyof typeof EventType];

export interface Event {
    id: number;
    title: string;
    description?: string;
    link?: string;
    rating?: number;
    reviews_count?: number;
    ratings_count?: number;
    min_age?: number;
    seats_available?: number;
    min_price?: number;
    currency?: string;
    event_type: EventType;
    starts_at?: string; // Timestamp as string
    image_url?: string;
    created_at?: string;
    updated_at?: string;
    address?: Address; // Адрес может быть внутри event
}

export interface Address {
    venue_name?: string;
    fullAddress?: string;
    country?: string;
    city?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string | null;
}

export interface GetEventResponse {
    // Может быть объект event или плоский формат
    event?: Event;
    address?: Address;
    // Плоский формат - основные поля мероприятия
    id?: string | number;
    title?: string;
    description?: string;
    link?: string;
    rating?: number;
    reviews_count?: number;
    ratings_count?: number;
    min_age?: number;
    seats_available?: number;
    min_price?: number | null;
    currency?: string;
    event_type?: 'offline' | 'online' | EventType;
    starts_at?: string;
    image_url?: string;
    created_at?: string;
    updated_at?: string;
    // Адресные данные
    city?: string;
    country?: string;
    district?: string;
    fullAddress?: string;
    venue_name?: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string | null;
}

export interface GetListRequest {
    q?: string;
    sort?: string;
    city?: string;
    district?: string;
    min_price?: number;
    max_price?: number;
    event_date?: string;
    event_type?: 'offline' | 'online';
    category?: string[];
    limit?: number;
    last_id?: number;
}

export interface Category {
    title: string;
    code: string;
}

export interface FiltersData {
    min_price?: number;
    max_price?: number;
    cities?: string[];
    categories?: Category[];
}

export interface GetListResponse {
    data: Event[];
    filters?: FiltersData;
}

class EventsService {
    private readonly baseUrl: string;
    private accessToken: string | null = null;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    setAccessToken(token: string | null) {
        this.accessToken = token;
    }

    private handleNetworkError(error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = error instanceof Error ? error.name : '';
        
        if (
            errorName === 'TypeError' ||
            errorMessage.includes('ERR_CONNECTION_REFUSED') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Network request failed') ||
            errorMessage.includes('fetch')
        ) {
            notifyServiceUnavailable();
            return;
        }

        showGlobalNotification('Ошибка сети. Попробуйте позже.', 'error');
    }

    private buildQueryString(params: Record<string, any>): string {
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(item => queryParams.append(key, String(item)));
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });
        
        return queryParams.toString();
    }

    async getEvent(id: number): Promise<{ event: Event }> {
        let response: Response;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            addTelegramInitDataHeader(headers);

            response = await fetch(`${this.baseUrl}/v1/events/${id}`, {
                method: 'GET',
                headers,
                credentials: 'include',
            });
        } catch (error) {
            this.handleNetworkError(error);
            throw error;
        }

        if (response.status === 503) {
            notifyServiceUnavailable();
            const error = await response.json().catch(() => ({
                message: 'Service Unavailable',
            }));
            throw new Error(error.message || 'Service Unavailable');
        }

        if (response.status === 500) {
            showGlobalNotification('Ошибка сервера. Пожалуйста, попробуйте позже.', 'error');
            const error = await response.json().catch(() => ({
                message: 'Internal Server Error',
            }));
            throw new Error(error.message || 'Internal Server Error');
        }

        if (response.status === 401) {
            notifyUnauthorized();
            const error = await response.json().catch(() => ({
                message: 'Unauthorized',
            }));
            throw new Error(error.message || 'Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: 'An error occurred',
            }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        const responseData: GetEventResponse = await response.json();
        
        // Новый формат API: данные приходят в плоском формате
        // Преобразуем responseData в формат Event
        let event: Event;
        if (responseData.event) {
            // Если есть объект event, используем его (адрес уже может быть внутри)
            event = responseData.event;
        } else {
            // Если event нет, значит данные приходят в плоском формате
            const eventType = responseData.event_type === 'offline' || responseData.event_type === EventType.OFFLINE 
                ? EventType.OFFLINE 
                : EventType.ONLINE;
            
            // Формируем объект address из данных ответа
            const address: Address | undefined = responseData.address || (responseData.venue_name || responseData.fullAddress || responseData.city ? {
                venue_name: responseData.venue_name,
                fullAddress: responseData.fullAddress,
                city: responseData.city,
                country: responseData.country,
                district: responseData.district,
                latitude: responseData.latitude,
                longitude: responseData.longitude,
                postal_code: responseData.postal_code,
            } : undefined);
            
            event = {
                id: Number(responseData.id) || 0,
                title: responseData.title || '',
                description: responseData.description,
                link: responseData.link,
                rating: responseData.rating,
                reviews_count: responseData.reviews_count,
                ratings_count: responseData.ratings_count,
                min_age: responseData.min_age,
                seats_available: responseData.seats_available,
                min_price: responseData.min_price ?? undefined,
                currency: responseData.currency,
                event_type: eventType,
                starts_at: responseData.starts_at,
                image_url: responseData.image_url,
                created_at: responseData.created_at,
                updated_at: responseData.updated_at,
                address: address, // Адрес внутри event
            };
        }
        
        // Возвращаем только event (адрес уже внутри)
        return {
            event,
        };
    }

    async getEventsList(params: GetListRequest = {}): Promise<GetListResponse> {
        let response: Response;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            addTelegramInitDataHeader(headers);

            const queryString = this.buildQueryString(params);
            const url = `${this.baseUrl}/v1/events/list${queryString ? `?${queryString}` : ''}`;

            response = await fetch(url, {
                method: 'GET',
                headers,
                credentials: 'include',
            });
        } catch (error) {
            this.handleNetworkError(error);
            throw error;
        }

        if (response.status === 503) {
            notifyServiceUnavailable();
            const error = await response.json().catch(() => ({
                message: 'Service Unavailable',
            }));
            throw new Error(error.message || 'Service Unavailable');
        }

        if (response.status === 500) {
            showGlobalNotification('Ошибка сервера. Пожалуйста, попробуйте позже.', 'error');
            const error = await response.json().catch(() => ({
                message: 'Internal Server Error',
            }));
            throw new Error(error.message || 'Internal Server Error');
        }

        if (response.status === 401) {
            notifyUnauthorized();
            const error = await response.json().catch(() => ({
                message: 'Unauthorized',
            }));
            throw new Error(error.message || 'Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: 'An error occurred',
            }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        const responseData: GetListResponse = await response.json();
        return {
            data: responseData.data || [],
            filters: responseData.filters
        };
    }
}

export const eventsService = new EventsService();

