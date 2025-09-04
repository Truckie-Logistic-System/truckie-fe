import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AUTH_ACCESS_TOKEN_KEY } from '../../config';
import { handleApiError } from './errorHandler';

// Create an axios instance with default config
const httpClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1', // Do not remove the /api/v1
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
        const token = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Nếu lỗi 401 (Unauthorized) và chưa thử refresh token
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

                // Chuyển hướng đến trang đăng nhập
                window.location.href = '/auth/login';

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