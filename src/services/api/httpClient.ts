import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { handleApiError } from "./errorHandler";

// Create an axios instance with default config
const httpClient = axios.create({
  //baseURL: 'http://localhost:8080/api/v1', // Make sure this matches your backend URL
  baseURL: "http://localhost:8080/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  // Quan trọng: cho phép gửi cookie với các request
  withCredentials: true,
});

// Biến để theo dõi nếu đang refresh token
let isRefreshing = false;
// Hàng đợi các request đang chờ token mới
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// Request interceptor for logging
httpClient.interceptors.request.use((config) => {
  console.log("Making API request:", config.method?.toUpperCase(), config.url);

  // Ensure withCredentials is set for all requests
  config.withCredentials = true;

  // Add more detailed logging for password change requests
  if (config.url?.includes("change-password")) {
    console.log("Password change request details:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });
  } else {
    console.log("Request data:", config.data);
  }

  return config;
});

// Response interceptor for handling errors
httpClient.interceptors.response.use(
  (response) => {
    console.log("API response success:", response.status, response.config.url);

    // Add more detailed logging for password change responses
    if (response.config.url?.includes("change-password")) {
      console.log("Password change response:", {
        status: response.status,
        data: response.data,
      });
    }

    // Check if the API returned success: false
    if (response.data && response.data.success === false) {
      console.warn(
        "API returned success: false with message:",
        response.data.message
      );

      // For auth endpoints, let the service handle the error
      const isAuthEndpoint =
        response.config.url && response.config.url.includes("/auths");

      if (!isAuthEndpoint) {
        // For non-auth endpoints, reject with the error
        return Promise.reject(
          new Error(response.data.message || "Đã xảy ra lỗi")
        );
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    console.error(
      "API response error:",
      error.message,
      error.response?.status,
      error.config?.url
    );

    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Kiểm tra nếu request đang gọi là refresh token
    const isRefreshTokenRequest =
      originalRequest.url &&
      originalRequest.url.includes("/auths/token/refresh");

    // Nếu lỗi đến từ request refresh token, không thử refresh lại
    if (isRefreshTokenRequest) {
      const authService = await import("../auth/authService").then(
        (module) => module.default
      );
      authService.logout();

      if (!window.location.pathname.includes("/auth/login")) {
        window.location.href = "/auth/login";
      }

      return Promise.reject(handleApiError(error, "Phiên đăng nhập hết hạn"));
    }

    // Don't attempt token refresh for auth endpoints (except refresh token)
    const isAuthEndpoint =
      originalRequest.url &&
      originalRequest.url.includes("/auths") &&
      !originalRequest.url.includes("/token/refresh");

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
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return httpClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Đánh dấu đang refresh token
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Import authService ở đây để tránh circular dependency
        const authService = await import("../auth/authService").then(
          (module) => module.default
        );

        // Thử refresh token
        const response = await authService.refreshToken();

        // Kiểm tra cấu trúc response và lấy token mới
        let newToken = "";
        const responseData = response.data as any;

        if (responseData) {
          if (responseData.accessToken) {
            newToken = responseData.accessToken;
          } else if (responseData.data && responseData.data.accessToken) {
            newToken = responseData.data.accessToken;
          }
        }

        if (!newToken) {
          throw new Error("Invalid refresh token response format");
        }

        // Đảm bảo token mới được áp dụng cho request hiện tại
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        // Nếu lỗi 401 (Unauthorized) và chưa thử refresh token và không phải là endpoint auth
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            // Nếu đang refresh, thêm request vào hàng đợi
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return httpClient(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          // Đánh dấu đang refresh token
          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Import authService ở đây để tránh circular dependency
            const authService = await import("../auth/authService").then(
              (module) => module.default
            );

            console.log("Attempting to refresh token...");

            // Thử refresh token
            await authService.refreshToken();

            console.log(
              "Token refreshed successfully, cookies should be set by the server"
            );

            // Tăng thời gian chờ để đảm bảo cookie được set đúng
            console.log("Waiting for cookies to be properly set...");
            await new Promise((resolve) => setTimeout(resolve, 500));
            console.log("Wait complete, proceeding with original request");

            // Xử lý hàng đợi các request
            processQueue(null);

            console.log(
              "Retrying original request with new token:",
              originalRequest.url
            );

            // Thêm thông tin debug cho request gốc
            console.log("Original request config:", {
              url: originalRequest.url,
              method: originalRequest.method,
              headers: originalRequest.headers,
              withCredentials: originalRequest.withCredentials,
            });

            // Thực hiện lại request ban đầu với token mới
            return httpClient(originalRequest);
          } catch (refreshError) {
            // Nếu refresh thất bại, xử lý lỗi và đăng xuất
            processQueue(refreshError);

            // Import authService ở đây để tránh circular dependency
            const authService = await import("../auth/authService").then(
              (module) => module.default
            );

            // Đăng xuất người dùng
            authService.logout();

            // Chuyển hướng đến trang đăng nhập chỉ khi không phải đang ở trang đăng nhập
            if (!window.location.pathname.includes("/auth/login")) {
              window.location.href = "/auth/login";
            }

            return Promise.reject(
              handleApiError(refreshError, "Phiên đăng nhập hết hạn")
            );
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(
          handleApiError(refreshError, "Phiên đăng nhập hết hạn")
        );
      } finally {
        isRefreshing = false;
      }
    }

    // Xử lý các lỗi khác
    return Promise.reject(handleApiError(error));
  }
);

export default httpClient;
