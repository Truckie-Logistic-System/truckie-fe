import httpClient from '../api/httpClient';
import { AUTH_REFRESH_TOKEN_KEY, AUTH_ACCESS_TOKEN_KEY } from '../../config';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RefreshTokenResponse,
    ChangePasswordRequest,
    ChangePasswordResponse
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

            // Kiểm tra response có thành công không
            if (!response.data.success) {
                throw new Error(response.data.message || 'Làm mới token thất bại');
            }

            // Lưu token mới vào localStorage
            if (response.data.data && response.data.data.accessToken && response.data.data.refreshToken) {
                localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.data.data.accessToken);
                localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.data.refreshToken);

                // Cập nhật Authorization header cho các request tiếp theo
                httpClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.accessToken}`;
            } else {
                console.error('Invalid refresh token response format:', response.data);
                throw new Error('Định dạng phản hồi token không hợp lệ');
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
    },

    /**
     * Change user password
     * @param data Password change data
     * @returns Promise with change password response
     */
    changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
        try {
            console.log('Sending change password request:', {
                ...data,
                oldPassword: '***',
                newPassword: '***',
                confirmNewPassword: '***'
            });

            const response = await httpClient.put<ChangePasswordResponse>('/auths/change-password', data);

            console.log('Change password response:', response.data);

            if (!response.data.success) {
                console.error('Change password failed with message:', response.data.message);
                throw new Error(response.data.message || 'Đổi mật khẩu thất bại');
            }

            return response.data;
        } catch (error: any) {
            console.error('Change password error:', error);

            // Xử lý lỗi cụ thể từ API
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                if (errorData.message) {
                    throw new Error(errorData.message);
                }
            }

            throw handleApiError(error, 'Đổi mật khẩu thất bại');
        }
    }
};

export default authService; 