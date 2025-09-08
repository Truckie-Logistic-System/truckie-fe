import httpClient from '../api/httpClient';
import { AUTH_REFRESH_TOKEN_KEY, AUTH_ACCESS_TOKEN_KEY } from '../../config';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RefreshTokenResponse
} from './types';
import { mapUserResponseToModel } from '@/models/User';
import { handleApiError } from '../api/errorHandler';

/**
 * Service for handling authentication API calls
 */
const authService = {
    /**
     * Login with username and password
     * @param username User's username
     * @param password User's password
     * @returns Promise with login response
     */
    login: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const loginData: LoginRequest = { username, password };
            const response = await httpClient.post<LoginResponse>('/auths', loginData);

            // Check if the API returned success: false
            if (!response.data.success) {
                console.warn('Login API returned success: false with message:', response.data.message);
                throw new Error(response.data.message || 'Đăng nhập thất bại');
            }

            // Lưu token và thông tin người dùng vào localStorage
            localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.data.data.authToken);
            localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.data.refreshToken);
            localStorage.setItem('user_role', response.data.data.user.role.roleName.toLowerCase());
            localStorage.setItem('userId', response.data.data.user.id);
            localStorage.setItem('username', response.data.data.user.username);
            localStorage.setItem('email', response.data.data.user.email);

            // Thêm dòng hello username
            response.data.message = `Hello ${response.data.data.user.username}! ${response.data.message}`;

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            // Make sure to pass the error directly to preserve all error information
            throw error;
        }
    },

    /**
     * Register a new user
     * @param userData User registration data
     * @returns Promise with registration response
     */
    register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
        try {
            const response = await httpClient.post<RegisterResponse>('/auths/customer/register', userData);

            // Check if the API returned success: false
            if (!response.data.success) {
                console.warn('Register API returned success: false with message:', response.data.message);
                throw new Error(response.data.message || 'Đăng ký thất bại');
            }

            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            // Pass the error directly to preserve all error information
            throw error;
        }
    },

    /**
     * Refresh the authentication token
     * @returns Promise with refresh token response
     */
    refreshToken: async (): Promise<RefreshTokenResponse> => {
        try {
            const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);

            if (!refreshToken) {
                throw new Error('Không tìm thấy refresh token');
            }

            const response = await httpClient.post<RefreshTokenResponse>('/auths/token/refresh', {
                refreshToken
            });

            if (response.data.success) {
                localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.data.data.accessToken);
                localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.data.refreshToken);
            }

            return response.data;
        } catch (error: any) {
            console.error('Token refresh error:', error);
            // Xử lý trường hợp refresh token hết hạn hoặc không hợp lệ
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                // Xóa token không hợp lệ và đăng xuất người dùng
                authService.logout();
            }
            throw handleApiError(error, 'Làm mới token thất bại');
        }
    },

    /**
     * Logout the current user
     */
    logout: (): void => {
        localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
        localStorage.removeItem('user_role');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
    },

    /**
     * Check if user is logged in
     * @returns Boolean indicating if user is logged in
     */
    isLoggedIn: (): boolean => {
        return !!localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
    },

    /**
     * Get the current user's role
     * @returns User role or null if not logged in
     */
    getUserRole: (): string | null => {
        return localStorage.getItem('user_role');
    }
};

export default authService; 