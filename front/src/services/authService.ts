import { API_BASE_URL } from '../config';
import { showGlobalNotification } from '../contexts/NotificationContext';
import { notifyServiceUnavailable } from '../utils/serviceUnavailable';
import { addTelegramInitDataHeader } from '../utils/telegramInitData';
import { notifyUnauthorized } from '../utils/unauthorized';

export interface RegisterData {
    telegram_token? :   string
	

	password?:        string
	password_confirm?:  string

    info: {
        name?:string;
        email?: string | null;
        telegram_username? : string
        language?: string;
        country?: string;
        city?: string;
        interests?: {
            code: string,
        }[] ;
    }

}


export interface AuthResponse {
    access_token: string;
    refresh_token?: string;
    user: {
        id: number;
        email: string;
        first_name: string;
        last_name?: string;
        username?: string;
    };
}

export interface TelegramAuthData {
    init_data: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
}

class AuthService {
    private readonly baseUrl: string;
    private readonly CURRENT_USER_CACHE_TTL_MS = 10000;
    private currentUserCache: {
        token: string | null;
        data: {
            id: number;
            name: string;
            email?: string;
            country?: string;
            city?: string;
            language?: string;
            interests?: string[];
            collections?: string[];
        };
        timestamp: number;
    } | null = null;
    private currentUserRequest: Promise<{
        id: number;
        name: string;
        email?: string;
        country?: string;
        city?: string;
        language?: string;
        interests?: string[];
        collections?: string[];
    }> | null = null;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }


    // Method to set access token for requests (called from AuthContext)
    private accessToken: string | null = null;

    setAccessToken(token: string | null) {
        if (this.accessToken === token) {
            return;
        }
        this.accessToken = token;
        this.currentUserCache = null;
        this.currentUserRequest = null;
    }

    // Helper method to handle network errors
    private handleNetworkError(error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = error instanceof Error ? error.name : '';
        
        // Check for network errors
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

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Merge existing headers if they are a plain object
        if (options.headers) {
            if (options.headers instanceof Headers) {
                options.headers.forEach((value, key) => {
                    headers[key] = value;
                });
            } else if (Array.isArray(options.headers)) {
                options.headers.forEach(([key, value]) => {
                    headers[key] = value;
                });
            } else {
                Object.assign(headers, options.headers);
            }
        }
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        addTelegramInitDataHeader(headers);

        let response: Response;
        try {
            response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
                credentials: 'include', // Include cookies in request and response
            });
        } catch (error) {
            // Handle network errors (ERR_CONNECTION_REFUSED, etc.)
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

        // Handle 500 Internal Server Error
        if (response.status === 500) {
            showGlobalNotification('Произошла ошибка. Попробуйте позже.', 'error');
            const error = await response.json().catch(() => ({
                message: 'Internal Server Error',
            }));
            throw new Error(error.message || 'Internal Server Error');
        }

        // Handle 401 Unauthorized - token expired
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

        return response.json();
    }

    async register(data: RegisterData): Promise<{ id: number; accessTokenFromHeader?: string }> {
        let response: Response;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            addTelegramInitDataHeader(headers);

            response = await fetch(`${this.baseUrl}/v1/user/create`, {
                method: 'POST',
                headers,
                credentials: 'include', // Include cookies in request and response
                body: JSON.stringify(data),
            });
        } catch (error) {
            // Handle network errors (ERR_CONNECTION_REFUSED, etc.)
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

        // Handle 500 Internal Server Error
        if (response.status === 500) {
            showGlobalNotification('Произошла ошибка. Попробуйте позже.', 'error');
            const error = await response.json().catch(() => ({
                message: 'Internal Server Error',
            }));
            throw new Error(error.message || 'Internal Server Error');
        }

        if (response.status === 409) {
            showGlobalNotification('Пользователь с такой почтой уже существует.', 'error');
            const error = await response.json().catch(() => ({
                message: 'User already exists',
            }));
            throw new Error(error.message || 'User already exists');
        }

        // Handle 401 Unauthorized - token expired
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

        // Extract access token from Authorization header
        const authorizationHeader = response.headers.get('Authorization');
        let accessTokenFromHeader: string | undefined;

        if (authorizationHeader) {
            // Authorization header format: "Bearer {token}" or just "{token}"
            const parts = authorizationHeader.trim().split(' ');
            accessTokenFromHeader = parts[1];
        }

        const responseData = await response.json();

        // Refresh token is stored in cookie by server, no need to return it
        return {
            ...responseData,
            accessTokenFromHeader,
        };
    }

    async login(data: LoginData): Promise<LoginResponse> {
        const endpoint = '/v1/auth/login';
        return this.request<LoginResponse>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }


    async checkAccess(): Promise<{ status?: string; accessTokenFromHeader?: string; id?: number }> {
        let response: Response;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            addTelegramInitDataHeader(headers);

            response = await fetch(`${this.baseUrl}/access/v1/check`, {
                method: 'GET',
                headers,
                credentials: 'include', // Include cookies in request and response
            });
        } catch (error) {
            // Handle network errors (ERR_CONNECTION_REFUSED, etc.)
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

        // Handle 500 Internal Server Error
        if (response.status === 500) {
            showGlobalNotification('Произошла ошибка. Попробуйте позже.', 'error');
            const error = await response.json().catch(() => ({
                message: 'Internal Server Error',
            }));
            throw new Error(error.message || 'Internal Server Error');
        }

        // Handle 401 Unauthorized
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

        // Extract access token from Authorization header if present
        const authorizationHeader = response.headers.get('Authorization');
        let accessTokenFromHeader: string | undefined;

        if (authorizationHeader) {
            // Authorization header format: "Bearer {token}"
            const parts = authorizationHeader.trim().split(' ');
            accessTokenFromHeader = parts[1];
        }

        const responseData = await response.json();
        responseData.status = "ok"
        return {
            ...responseData,
            accessTokenFromHeader,
        };
    }

    async getCurrentUser(): Promise<{
        id: number;
        name: string;
        email?: string;
        country?: string;
        city?: string;
        language?: string;
        interests?: string[];
        collections?: string[];
    }> {
        const now = Date.now();
        if (
            this.currentUserCache &&
            this.currentUserCache.token === this.accessToken &&
            now - this.currentUserCache.timestamp < this.CURRENT_USER_CACHE_TTL_MS
        ) {
            return this.currentUserCache.data;
        }

        if (this.currentUserRequest) {
            return this.currentUserRequest;
        }

        this.currentUserRequest = (async () => {
            const endpoint = '/v1/user';
            const response = await this.request<{
                user: {
                    id: string;
                    info: {
                        name: string;
                        email?: string;
                        username?: string;
                        telegramInitData?: string;
                        country?: string;
                        city?: string;
                        language?: string;
                        interests?: Array<string | { code?: string; title?: string }>;
                        role?: string;
                    };
                    createdAt?: string;
                    updatedAt?: string | null;
                };
            }>(endpoint);

            const rawInterests = response.user.info.interests || [];
            const normalizedInterests = rawInterests
                .map((interest) => {
                    if (typeof interest === 'string') {
                        return interest;
                    }
                    return interest?.code || '';
                })
                .filter((code): code is string => Boolean(code));

            const userData = {
                id: parseInt(response.user.id, 10),
                name: response.user.info.name,
                email: response.user.info.email || undefined,
                country: response.user.info.country || undefined,
                city: response.user.info.city || undefined,
                language: response.user.info.language || undefined,
                interests: normalizedInterests,
                collections: [],
            };

            this.currentUserCache = {
                token: this.accessToken,
                data: userData,
                timestamp: Date.now(),
            };

            return userData;
        })();

        try {
            return await this.currentUserRequest;
        } finally {
            this.currentUserRequest = null;
        }
    }

}

export const authService = new AuthService();



