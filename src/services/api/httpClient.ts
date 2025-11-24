import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { handleApiError } from './errorHandler';
import { API_URL } from '@/config/env';

// Event emitter for logout events
const logoutEventTarget = new EventTarget();
export const LOGOUT_EVENT = 'auth:logout';

export const onLogout = (callback: () => void) => {
  logoutEventTarget.addEventListener(LOGOUT_EVENT, callback);
  return () => logoutEventTarget.removeEventListener(LOGOUT_EVENT, callback);
};

const emitLogout = () => {
  logoutEventTarget.dispatchEvent(new Event(LOGOUT_EVENT));
};

// Create an axios instance with default config
const httpClient = axios.create({
  baseURL: API_URL,
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

    // PROACTIVE TOKEN REFRESH: Check and refresh token before request
    // Skip refresh for the refresh endpoint itself to avoid infinite loop
    if (!config.url?.includes('/token/refresh')) {
      // Get current token to check expiry
      const currentToken = authService.getAuthToken();
      
      if (currentToken && isTokenExpiringSoon(currentToken)) {
        try {
          await authService.refreshToken();
        } catch (error) {
          console.warn('[httpClient] ⚠️ Proactive token refresh failed:', error);
          // Continue with current token anyway
        }
      }
    }

    // CRITICAL: Always get the LATEST token right before setting header
    // This ensures we use the refreshed token if refresh just happened
    const freshToken = authService.getAuthToken();

    // Add auth token to headers if available
    if (freshToken && config.headers) {
      // Use set method to ensure header is properly updated in AxiosHeaders
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${freshToken}`);
      } else {
        config.headers['Authorization'] = `Bearer ${freshToken}`;
      }
      
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
        
        // Emit logout event to notify AuthContext
        emitLogout();

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
      

      // Kiểm tra số lần thử refresh token
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.error('[httpClient] ❌ Max refresh attempts reached, logging out');
        const authService = await import('../auth/authService').then(module => module.default);
        authService.logout();
        
        // Emit logout event to notify AuthContext
        emitLogout();

        return Promise.reject(handleApiError(error, 'Phiên đăng nhập hết hạn sau nhiều lần thử'));
      }

      if (isRefreshing) {
        // Nếu đang refresh, thêm request vào hàng đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // IMPORTANT: Delete old Authorization header before retry
          // This forces the request interceptor to add the new token
          if (originalRequest.headers) {
            delete originalRequest.headers.Authorization;
          }
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
          
          // Thử refresh token
          await authService.refreshToken();
        } catch (refreshTokenError: any) {
          console.error('[httpClient] ❌ Token refresh failed:', refreshTokenError.message);
          
          // Check if this might be a server restart scenario
          if (refreshTokenError.response?.status === 0 || !refreshTokenError.response) {
            console.warn('[httpClient] 🔄 Possible server restart - checking localStorage for user data');
            const hasStoredUserData = localStorage.getItem('remember_login') === 'true' && 
                                     localStorage.getItem('user_role') && 
                                     localStorage.getItem('userId');
            
            if (hasStoredUserData) {
              // Don't logout immediately - give user a chance to reconnect
              throw new Error('Mất kết nối đến server. Vui lòng thử lại sau.');
            }
          }
          
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

        // IMPORTANT: Delete old Authorization header and reset retry flag
        // This forces the request interceptor to add the new token
        if (originalRequest.headers) {
          delete originalRequest.headers.Authorization;
        }
        delete originalRequest._retry;
        
        
        // Thực hiện lại request ban đầu với token mới
        // The request interceptor will automatically add the new token
        return httpClient(originalRequest);
      } catch (refreshError) {
        console.error('[httpClient] ❌ Refresh failed, logging out:', refreshError);
        // Nếu refresh thất bại, xử lý lỗi và đăng xuất
        processQueue(refreshError);

        // Import authService ở đây để tránh circular dependency
        const authService = await import('../auth/authService').then(module => module.default);

        // Đăng xuất người dùng
        authService.logout();
        
        // Emit logout event to notify AuthContext
        emitLogout();

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