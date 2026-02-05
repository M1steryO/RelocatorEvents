import { showGlobalNotification } from '../contexts/NotificationContext';
import { notifyServiceUnavailable } from '../utils/serviceUnavailable';
import { addTelegramInitDataHeader } from '../utils/telegramInitData';
import { notifyUnauthorized } from '../utils/unauthorized';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    || import.meta.env.VITE_REVIEWS_API_BASE_URL
    || import.meta.env.VITE_EVENTS_API_BASE_URL
    || 'http://localhost:50043';

export enum MediaType {
    MEDIA_TYPE_UNKNOWN = 0,
    MEDIA_TYPE_IMAGE = 1,
    MEDIA_TYPE_VIDEO = 2,
}

export interface MediaAttachment {
    storage_key: string;
    type: MediaType;
}

export interface Review {
    grade: number;
    advantages?: string;
    disadvantages?: string;
    text: string;
    media?: MediaAttachment[];
}

export interface ListReviewsResponse {
    reviews: Review[];
}

class ReviewsService {
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

    async listReviews(eventId: number): Promise<ListReviewsResponse> {
        let response: Response;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            addTelegramInitDataHeader(headers);

            const url = `${this.baseUrl}/v1/reviews?event_id=${eventId}`;
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

        const responseData: ListReviewsResponse = await response.json();
        return {
            reviews: responseData.reviews || [],
        };
    }

    async createReview(eventId: number, review: Review): Promise<void> {
        let response: Response;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            addTelegramInitDataHeader(headers);

            response = await fetch(`${this.baseUrl}/v1/reviews`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    event_id: eventId,
                    review,
                }),
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
    }
}

export const reviewsService = new ReviewsService();
