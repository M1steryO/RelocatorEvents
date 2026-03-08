import { API_BASE_URL } from '../config';
import { addTelegramInitDataHeader } from '../utils/telegramInitData';
import { showGlobalNotification } from '../contexts/NotificationContext';
import { notifyServiceUnavailable } from '../utils/serviceUnavailable';
import { notifyUnauthorized } from '../utils/unauthorized';

export interface FavouriteEvent {
    id: number;
    title?: string;
    description?: string;
    link?: string;
    rating?: number;
    min_age?: number;
    min_price?: number;
    starts_at?: string;
    image_url?: string;
    created_at?: string;
    currency?: string;
}

export interface ListFavouritesResponse {
    events?: FavouriteEvent[];
}

class FavouritesService {
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

    async listFavourites(): Promise<FavouriteEvent[]> {
        let response: Response;
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            addTelegramInitDataHeader(headers);

            response = await fetch(`${this.baseUrl}/v1/events/favourites/list`, {
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
            throw new Error('Service Unavailable');
        }
        if (response.status === 500) {
            showGlobalNotification('Произошла ошибка. Попробуйте позже.', 'error');
            throw new Error('Internal Server Error');
        }
        if (response.status === 401) {
            notifyUnauthorized();
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || `HTTP ${response.status}`);
        }

        const data: ListFavouritesResponse = await response.json();
        return Array.isArray(data.events) ? data.events : [];
    }

    async addFavourite(eventId: number): Promise<void> {
        let response: Response;
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            addTelegramInitDataHeader(headers);

            response = await fetch(`${this.baseUrl}/v1/events/favourites`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ event_id: eventId }),
            });
        } catch (error) {
            this.handleNetworkError(error);
            throw error;
        }

        if (response.status === 503) {
            notifyServiceUnavailable();
            throw new Error('Service Unavailable');
        }
        if (response.status === 500) {
            showGlobalNotification('Произошла ошибка. Попробуйте позже.', 'error');
            throw new Error('Internal Server Error');
        }
        if (response.status === 401) {
            notifyUnauthorized();
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || `HTTP ${response.status}`);
        }
    }

    async deleteFavourite(eventId: number): Promise<void> {
        let response: Response;
        try {
            const headers: Record<string, string> = {};
            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            addTelegramInitDataHeader(headers);

            response = await fetch(`${this.baseUrl}/v1/events/favourites/${eventId}`, {
                method: 'DELETE',   
                headers,
                credentials: 'include',
            });
        } catch (error) {
            this.handleNetworkError(error);
            throw error;
        }

        if (response.status === 503) {
            notifyServiceUnavailable();
            throw new Error('Service Unavailable');
        }
        if (response.status === 500) {
            showGlobalNotification('Произошла ошибка. Попробуйте позже.', 'error');
            throw new Error('Internal Server Error');
        }
        if (response.status === 401) {
            notifyUnauthorized();
            throw new Error('Unauthorized');
        }
        if (!response.ok && response.status !== 204) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || `HTTP ${response.status}`);
        }
    }
}

export const favouritesService = new FavouritesService();
