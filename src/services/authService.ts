import api from './api';
import { AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from '../config';
import axios from 'axios';

interface LoginRequest {
    username: string;
    password: string;
}

interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl: string;
    fullName: string;
    phoneNumber: string;
    companyName: string;
    representativeName: string;
    representativePhone: string;
    businessLicenseNumber: string;
    businessAddress: string;
}

interface RegisterResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: {
        id: string;
        companyName: string;
        representativeName: string;
        representativePhone: string;
        businessLicenseNumber: string;
        businessAddress: string;
        status: string;
        userResponse: {
            id: string;
            username: string;
            fullName: string;
            email: string;
            phoneNumber: string;
            gender: boolean;
            dateOfBirth: string;
            imageUrl: string;
            status: string;
            role: {
                id: string;
                roleName: string;
                description: string;
                isActive: boolean;
            }
        }
    }
}

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    statusCode: number;
    data: T;
}

interface LoginResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: {
        authToken: string;
        refreshToken: string;
        user: {
            id: string;
            username: string;
            fullName: string;
            email: string;
            phoneNumber: string | null;
            gender: string | null;
            dateOfBirth: string;
            imageUrl: string | null;
            status: string;
            role: {
                id: string;
                roleName: string;
                description: string;
                isActive: boolean;
            };
        };
    };
}

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
            // Đặt withCredentials: true để nhận cookies từ server
            const response = await api.post<LoginResponse>('/api/v1/auths', { username, password }, { withCredentials: true });

            // Lưu trữ token trong localStorage (tạm thời cho đến khi backend hỗ trợ HTTP-only cookie)
            // TODO: Loại bỏ khi backend đã hỗ trợ HTTP-only cookie
            if (response.data.success) {
                localStorage.setItem(AUTH_TOKEN_KEY, response.data.data.authToken);
                localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.data.refreshToken);
            }

            return response.data;
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi phù hợp
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Lỗi từ server
                    console.error('Login API error:', error.response.data);
                    throw error;
                } else if (error.request) {
                    // Không nhận được phản hồi
                    console.error('Login API no response:', error.request);
                    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn');
                } else {
                    // Lỗi khi thiết lập request
                    console.error('Login API request error:', error.message);
                    throw new Error('Lỗi khi gửi yêu cầu đăng nhập');
                }
            }

            // Lỗi khác
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Register a new customer account
     * @param registerData Customer registration data
     * @returns Promise with registration response
     */
    register: async (registerData: RegisterRequest): Promise<RegisterResponse> => {
        try {
            const response = await api.post<RegisterResponse>('/api/v1/auths/customer/register', registerData);
            return response.data;
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi phù hợp
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Lỗi từ server
                    console.error('Register API error:', error.response.data);

                    // Trả về lỗi cụ thể từ server nếu có
                    if (error.response.data && error.response.data.message) {
                        throw new Error(error.response.data.message);
                    }

                    throw error;
                } else if (error.request) {
                    // Không nhận được phản hồi
                    console.error('Register API no response:', error.request);
                    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn');
                } else {
                    // Lỗi khi thiết lập request
                    console.error('Register API request error:', error.message);
                    throw new Error('Lỗi khi gửi yêu cầu đăng ký');
                }
            }

            // Lỗi khác
            console.error('Register error:', error);
            throw error;
        }
    },

    /**
     * Logout user by removing tokens
     */
    logout: async (): Promise<void> => {
        try {
            // Gọi API logout để server xóa HTTP-only cookie
            await api.post('/api/v1/auths/logout', {}, { withCredentials: true });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Xóa token từ localStorage (tạm thời cho đến khi backend hỗ trợ HTTP-only cookie)
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
            localStorage.removeItem('user_role');
        }
    },

    /**
     * Check if user is authenticated
     * @returns Boolean indicating if user is authenticated
     */
    isAuthenticated: (): boolean => {
        // TODO: Khi backend hỗ trợ HTTP-only cookie, cần thay đổi cách kiểm tra authentication
        // Có thể cần gọi API endpoint để kiểm tra token
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    },

    /**
     * Get current auth token
     * @returns Current auth token or null
     */
    getToken: (): string | null => {
        // TODO: Khi backend hỗ trợ HTTP-only cookie, phương thức này sẽ không cần thiết
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    /**
     * Get current refresh token
     * @returns Current refresh token or null
     */
    getRefreshToken: (): string | null => {
        // TODO: Khi backend hỗ trợ HTTP-only cookie, phương thức này sẽ không cần thiết
        return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
    },

    /**
     * Refresh the access token using refresh token
     * @returns Promise with refresh token response
     */
    refreshToken: async (): Promise<any> => {
        try {
            // Trong trường hợp sử dụng HTTP-only cookie, không cần gửi refresh token
            // Backend sẽ lấy refresh token từ cookie
            // Tuy nhiên, giữ lại code này cho đến khi backend được cập nhật
            const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);

            // Gọi API refresh token với withCredentials: true để nhận và gửi cookie
            const response = await api.post('/api/v1/auths/refresh',
                refreshToken ? { refreshToken } : {},
                { withCredentials: true }
            );

            if (response.data.success) {
                // Lưu token mới vào localStorage (tạm thời)
                localStorage.setItem(AUTH_TOKEN_KEY, response.data.data.authToken);
                localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.data.refreshToken);
            }

            return response.data;
        } catch (error) {
            console.error('Refresh token error:', error);
            // Xóa token khi refresh thất bại
            await authService.logout();
            throw error;
        }
    }
};

export default authService; 