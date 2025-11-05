import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { handleApiError } from './errorHandler';

// Create an axios instance with default config
const httpClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // Make sure this matches your backend URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Set withCredentials to true to send cookies with cross-origin requests
  withCredentials: true,
});

// Biến để theo dõi nếu đang refresh token
let isRefreshing = false;
// Hàng đợi các request đang chờ token mới
let failedQueue: any[] = [];
// Đếm số lần thử refresh token liên tiếp
let refreshAttempts = 0;
// Số lần thử tối đa
const MAX_REFRESH_ATTEMPTS = 2;
// Thời gian reset đếm số lần thử (ms)
const REFRESH_ATTEMPT_RESET_TIME = 60000; // 1 phút
// Timer để reset đếm số lần thử
let refreshAttemptsResetTimer: NodeJS.Timeout | null = null;

// Xử lý hàng đợi các request
const processQueue = (error: any) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// Check if JWT token is expired or expiring soon (within 5 minutes)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    // Manual JWT decode - split token and decode payload
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode payload (base64)
    const payload = parts[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Check if token expires within 5 minutes
    const isExpiringSoon = timeUntilExpiry < 5 * 60 * 1000;
    
    if (isExpiringSoon) {
      console.log(`⏰ [httpClient] Token expiring soon: ${Math.floor(timeUntilExpiry / 1000)} seconds left`);
    }
    
    return isExpiringSoon;
  } catch (error) {
    console.error('[httpClient] ❌ Error checking token expiry:', error);
    return true; // Assume expired if we can't decode
  }
};

// Request interceptor for adding auth token and logging
httpClient.interceptors.request.use(
  async (config) => {
    // Import authService here to avoid circular dependency
    const authService = await import('../auth/authService').then(module => module.default);

    // Get auth token from in-memory storage
    const authToken = authService.getAuthToken();

    // PROACTIVE TOKEN REFRESH: Check and refresh token before request
    // Skip refresh for the refresh endpoint itself to avoid infinite loop
    if (authToken && !config.url?.includes('/token/refresh')) {
      if (isTokenExpiringSoon(authToken)) {
        console.log('[httpClient] 🔄 Token expiring soon, proactively refreshing...');
        try {
          await authService.refreshToken();
          console.log('[httpClient] ✅ Proactive token refresh successful');
        } catch (error) {
          console.warn('[httpClient] ⚠️ Proactive token refresh failed:', error);
          // Continue with current token anyway
        }
      }
    }

    // Get fresh token after potential refresh
    const freshToken = authService.getAuthToken();

    // Add auth token to headers if available
    if (freshToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${freshToken}`;
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
    // Check if the API returned success: false
    if (response.data && response.data.success === false) {
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
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Kiểm tra nếu request đang gọi là refresh token
    const isRefreshTokenRequest = originalRequest.url && originalRequest.url.includes('/auths/token/refresh');

    // Nếu lỗi đến từ request refresh token, không thử refresh lại
    if (isRefreshTokenRequest) {
      // ONLY logout if refresh token is revoked (401/403)
      // For other errors (network, 500, etc), let the error propagate
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('[httpClient] ❌ Refresh token revoked, logging out');
        const authService = await import('../auth/authService').then(module => module.default);
        authService.logout();

        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }

        return Promise.reject(handleApiError(error, 'Phiên đăng nhập hết hạn'));
      } else {
        // For other errors, just reject without logging out
        console.warn('[httpClient] ⚠️ Refresh token request failed:', error.response?.status);
        return Promise.reject(handleApiError(error, 'Làm mới token thất bại'));
      }
    }

    // Don't attempt token refresh for auth endpoints (except refresh token)
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
      console.log(`[httpClient] 🔄 Got 401 error, attempting to refresh token (attempt ${refreshAttempts + 1}/${MAX_REFRESH_ATTEMPTS})`);

      // Kiểm tra số lần thử refresh token
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.error('[httpClient] ❌ Max refresh attempts reached, logging out');
        const authService = await import('../auth/authService').then(module => module.default);
        authService.logout();

        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }

        return Promise.reject(handleApiError(error, 'Phiên đăng nhập hết hạn sau nhiều lần thử'));
      }

      if (isRefreshing) {
        console.log('[httpClient] ⏳ Token refresh in progress, queuing request');
        // Nếu đang refresh, thêm request vào hàng đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          console.log('[httpClient] ✅ Token refreshed, retrying queued request');
          return httpClient(originalRequest);
        }).catch(err => {
          console.error('[httpClient] ❌ Queued request failed:', err);
          return Promise.reject(err);
        });
      }

      // Đánh dấu đang refresh token
      originalRequest._retry = true;
      isRefreshing = true;

      // Tăng số lần thử refresh token
      refreshAttempts++;

      // Thiết lập timer để reset đếm số lần thử
      if (refreshAttemptsResetTimer) {
        clearTimeout(refreshAttemptsResetTimer);
      }

      refreshAttemptsResetTimer = setTimeout(() => {
        refreshAttempts = 0;
        refreshAttemptsResetTimer = null;
      }, REFRESH_ATTEMPT_RESET_TIME);

      try {
        // Import authService ở đây để tránh circular dependency
        const authService = await import('../auth/authService').then(module => module.default);

        try {
          console.log('[httpClient] 🔑 Calling refreshToken()');
          // Thử refresh token
          await authService.refreshToken();
          console.log('[httpClient] ✅ Token refresh successful');
        } catch (refreshTokenError: any) {
          console.error('[httpClient] ❌ Token refresh failed:', refreshTokenError.message);
          // Nếu là lỗi khác, ném lại lỗi
          throw refreshTokenError;
        }

        // Kiểm tra token mới
        const newToken = authService.getAuthToken();

        // Kiểm tra xem token có được cấp không
        if (!newToken) {
          throw new Error("Không có token sau khi refresh");
        }

        // Xử lý hàng đợi các request
        processQueue(null);

        // Đảm bảo header Authorization được cập nhật với token mới
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }

        console.log('[httpClient] 🔄 Retrying original request with new token');
        // Thực hiện lại request ban đầu với token mới
        return httpClient(originalRequest);
      } catch (refreshError) {
        console.error('[httpClient] ❌ Refresh failed, logging out:', refreshError);
        // Nếu refresh thất bại, xử lý lỗi và đăng xuất
        processQueue(refreshError);

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

// Hàm để reset biến đếm refresh token
export const resetRefreshAttempts = () => {
  refreshAttempts = 0;
  if (refreshAttemptsResetTimer) {
    clearTimeout(refreshAttemptsResetTimer);
    refreshAttemptsResetTimer = null;
  }
};

export default httpClient; 