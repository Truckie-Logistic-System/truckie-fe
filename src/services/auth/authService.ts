import httpClient from '../api/httpClient';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    RefreshTokenResponse
} from './types';
import { handleApiError } from '../api/errorHandler';

// In-memory token storage
let authToken: string | null = null;
// Flag to track if initialization is in progress
let isInitializing = false;
// Promise for initialization
let initPromise: Promise<void> | null = null;

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

                // Check if we have user data in localStorage, which indicates
                // the user was previously logged in
                const userRole = localStorage.getItem('user_role');
                const userId = localStorage.getItem('userId');

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

            // Lưu thông tin người dùng vào localStorage
            const user = response.data.data.user;
            const roleName = user.role?.roleName;

            localStorage.setItem('user_role', roleName.toLowerCase());
            localStorage.setItem('userId', user.id);
            localStorage.setItem('username', user.username);
            localStorage.setItem('email', user.email);

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
            const response = await httpClient.post<RefreshTokenResponse>('/auths/token/refresh');

            if (!response.data.success) {
                throw new Error(response.data.message || 'Làm mới token thất bại');
            }

            // Update access token in memory
            const oldToken = authToken;
            authToken = response.data.data.accessToken;

            // Kiểm tra xem token có thực sự thay đổi không
            if (oldToken === authToken) {
                throw new Error("Token không thay đổi sau khi refresh");
            }

            return;
        } catch (error: any) {
            // Kiểm tra lỗi cụ thể
            if (error.response) {
                const statusCode = error.response.status;
                const errorMessage = error.response.data?.message || 'Làm mới token thất bại';

                // Xử lý trường hợp refresh token hết hạn hoặc không hợp lệ
                if (statusCode === 401 || statusCode === 403) {
                    // Đăng xuất người dùng
                    authService.logout();

                    // Thêm thông tin chi tiết về lỗi
                    throw new Error(`Phiên đăng nhập hết hạn (${statusCode}): ${errorMessage}`);
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

            // Xóa thông tin người dùng khỏi localStorage
            localStorage.removeItem('user_role');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('email');

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