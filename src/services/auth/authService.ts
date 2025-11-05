import httpClient from '../api/httpClient';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ChangePasswordRequest,
    ChangePasswordResponse
} from './types';
import type { ApiResponse } from '../api/types';
import { handleApiError } from '../api/errorHandler';

// In-memory token storage
let authToken: string | null = null;
// Flag to track if initialization is in progress
let isInitializing = false;
// Promise for initialization
let initPromise: Promise<void> | null = null;

// Khai báo kiểu cho window object
declare global {
    interface Window {
        __AUTH_TOKEN__?: string | null;
    }
}

/**
 * Service for handling authentication API calls
 */
const authService = {
    /**
     * Initialize authentication state
     * This should be called when the application starts
     * @returns Promise that resolves when initialization is complete
     */
    initAuth: async (): Promise<void> => {
        // If already initializing, return the existing promise
        if (isInitializing && initPromise) {
            return initPromise;
        }

        isInitializing = true;

        initPromise = (async () => {
            try {
                // If we already have a token in memory, we're already authenticated
                if (authToken) {
                    return;
                }

                // Check if we have user data in sessionStorage, which indicates
                // the user was previously logged in
                const userRole = sessionStorage.getItem('user_role');
                const userId = sessionStorage.getItem('userId');

                // If we have user data but no token, try to refresh the token
                if (userRole && userId) {
                    try {
                        await authService.refreshToken();
                        console.log('Authentication restored after page refresh');
                    } catch (error) {
                        console.error('Failed to restore authentication:', error);
                        // Clear user data if refresh token fails
                        authService.logout();
                    }
                }
            } finally {
                isInitializing = false;
            }
        })();

        return initPromise;
    },

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

            // Store auth token in memory
            authToken = response.data.data.authToken;

            // Store token in window for external access
            window.__AUTH_TOKEN__ = authToken;

            // Lưu thông tin người dùng vào sessionStorage
            const user = response.data.data.user;
            const roleName = user.role?.roleName;

            sessionStorage.setItem('user_role', roleName.toLowerCase());
            sessionStorage.setItem('userId', user.id);
            sessionStorage.setItem('username', user.username);
            sessionStorage.setItem('email', user.email);

            // Thêm dòng hello username
            response.data.message = `Đăng nhập thành công`;

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
    refreshToken: async (): Promise<void> => {
        try {
            // Since refresh token is now handled via HttpOnly cookies,
            // Backend returns only access token in response body
            const response = await httpClient.post<ApiResponse<{ authToken: string }>>('/auths/token/refresh');

            if (!response.data.success) {
                throw new Error(response.data.message || 'Làm mới token thất bại');
            }

            // Update access token in memory
            authToken = response.data.data.authToken;

            // Store token in window for external access
            window.__AUTH_TOKEN__ = authToken;

            // SECURITY: Refresh token is stored in HttpOnly cookie by backend
            // Never exposed in JSON response (prevents XSS attacks)
            console.log('[authService] ✅ Token refreshed successfully');
            console.log('[authService] 🔐 Refresh token stored in HttpOnly cookie (secure)');
            return;
        } catch (error: any) {
            // Kiểm tra lỗi cụ thể
            if (error.response) {
                const statusCode = error.response.status;
                const errorMessage = error.response.data?.message || 'Làm mới token thất bại';

                // ONLY logout if refresh token is revoked (401/403)
                // Don't logout for other errors (network, 500, etc) - user can retry
                if (statusCode === 401 || statusCode === 403) {
                    console.error(`[authService] ❌ Refresh token revoked (${statusCode}): ${errorMessage}`);
                    // Đăng xuất người dùng
                    authService.logout();

                    // Thêm thông tin chi tiết về lỗi
                    throw new Error(`Phiên đăng nhập hết hạn (${statusCode}): ${errorMessage}`);
                } else {
                    // For other errors (network, 500, etc), just throw without logging out
                    console.warn(`[authService] ⚠️ Token refresh failed (${statusCode}): ${errorMessage}`);
                    throw new Error(errorMessage);
                }
            }

            throw handleApiError(error, 'Làm mới token thất bại');
        }
    },

    /**
     * Get the current authentication token
     * @returns Current auth token or null if not logged in
     */
    getAuthToken: (): string | null => {
        return authToken;
    },

    /**
     * Logout the current user
     */
    logout: async (): Promise<void> => {
        try {
            // Gọi API logout để vô hiệu hóa token ở phía server
            await httpClient.post('/auths/logout');
        } catch (error) {
            // Tiếp tục xử lý logout ở client side ngay cả khi API thất bại
        } finally {
            // Clear in-memory token
            authToken = null;

            // Clear token from window
            window.__AUTH_TOKEN__ = null;

            // Xóa thông tin người dùng khỏi sessionStorage
            sessionStorage.removeItem('user_role');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('email');

            // Reset biến đếm refresh token
            try {
                const { resetRefreshAttempts } = await import('../api/httpClient');
                resetRefreshAttempts();
            } catch (e) {
                console.error('Error resetting refresh token variables:', e);
            }
        }
    },

    /**
     * Check if user is logged in
     * @returns Boolean indicating if user is logged in
     */
    isLoggedIn: (): boolean => {
        // Kiểm tra dựa trên token trong memory
        return !!authToken;
    },

    /**
     * Get the current user's role
     * @returns User role or null if not logged in
     */
    getUserRole: (): string | null => {
        return sessionStorage.getItem('user_role');
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