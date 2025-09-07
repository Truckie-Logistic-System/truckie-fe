import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AUTH_ACCESS_TOKEN_KEY } from '../../config';
import { handleApiError } from './errorHandler';

// Create an axios instance with default config
const httpClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1', // Make sure this matches your backend URL
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    // Quan trọng: cho phép gửi cookie với các request
    withCredentials: true,
});

// Biến để theo dõi nếu đang refresh token
let isRefreshing = false;
// Hàng đợi các request đang chờ token mới
let failedQueue: any[] = [];

// Xử lý hàng đợi các request
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request interceptor for adding auth token
httpClient.interceptors.request.use(
    (config) => {
        console.log("Making API request:", config.method?.toUpperCase(), config.url);
        console.log("Request data:", config.data);

        const token = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
httpClient.interceptors.response.use(
    (response) => {
        console.log("API response success:", response.status, response.config.url);

        // Check if the API returned success: false
        if (response.data && response.data.success === false) {
            console.warn("API returned success: false with message:", response.data.message);

            // For auth endpoints, let the service handle the error
            const isAuthEndpoint = response.config.url && (
                response.config.url.includes('/auths')
            );

            if (!isAuthEndpoint) {
                // For non-auth endpoints, reject with the error
                return Promise.reject(new Error(response.data.message || 'Đã xảy ra lỗi'));
            }
        }

        return response;
    },
    async (error: AxiosError) => {
        console.error("API response error:", error.message, error.response?.status, error.config?.url);

        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Don't attempt token refresh for auth endpoints
        const isAuthEndpoint = originalRequest.url && (
            originalRequest.url.includes('/auths') &&
            !originalRequest.url.includes('/token/refresh')
        );

        // Skip token refresh for login/register endpoints
        if (isAuthEndpoint) {
            return Promise.reject(handleApiError(error));
        }

        // Nếu lỗi 401 (Unauthorized) và chưa thử refresh token và không phải là endpoint auth
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Nếu đang refresh, thêm request vào hàng đợi
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return httpClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            // Đánh dấu đang refresh token
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Import authService ở đây để tránh circular dependency
                const authService = await import('../auth/authService').then(module => module.default);

                // Thử refresh token
                const response = await authService.refreshToken();

                // Nếu refresh thành công, cập nhật token cho các request trong hàng đợi
                const newToken = response.data.accessToken;
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }

                // Xử lý hàng đợi các request
                processQueue(null, newToken);

                // Thực hiện lại request ban đầu với token mới
                return httpClient(originalRequest);
            } catch (refreshError) {
                // Nếu refresh thất bại, xử lý lỗi và đăng xuất
                processQueue(refreshError, null);

                // Import authService ở đây để tránh circular dependency
                const authService = await import('../auth/authService').then(module => module.default);

                // Đăng xuất người dùng
                authService.logout();

                // Chuyển hướng đến trang đăng nhập chỉ khi không phải đang ở trang đăng nhập
                if (!window.location.pathname.includes('/auth/login')) {
                    window.location.href = '/auth/login';
                }

                return Promise.reject(handleApiError(refreshError, 'Phiên đăng nhập hết hạn'));
            } finally {
                isRefreshing = false;
            }
        }

        // Xử lý các lỗi khác
        return Promise.reject(handleApiError(error));
    }
);

export default httpClient; 