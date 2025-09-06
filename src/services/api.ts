import axios from "axios";
import { API_URL, API_TIMEOUT, AUTH_TOKEN_KEY } from "../config";

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    console.log("=== API REQUEST DEBUG ===");
    console.log("URL:", config.url);
    console.log("Method:", config.method?.toUpperCase());
    console.log("Base URL:", config.baseURL);
    console.log("Full URL:", `${config.baseURL}${config.url}`);
    console.log("Headers:", JSON.stringify(config.headers, null, 2));

    if (config.data) {
      console.log("Request Body Type:", typeof config.data);
      console.log(
        "Request Body Content:",
        JSON.stringify(config.data, null, 2)
      );

      // Check if it's FormData
      if (config.data instanceof FormData) {
        console.log("FormData detected");
        for (let [key, value] of config.data.entries()) {
          console.log(`FormData ${key}:`, value);
        }
      }

      // Validate request structure for orders
      if (config.url === "/orders" && config.method === "post") {
        console.log("=== ORDER CREATION REQUEST VALIDATION ===");
        const data = config.data;
        console.log("Has orderRequest:", !!data.orderRequest);
        console.log("Has orderDetails:", !!data.orderDetails);

        if (data.orderRequest) {
          console.log("OrderRequest fields:");
          Object.keys(data.orderRequest).forEach((key) => {
            console.log(
              `  ${key}:`,
              data.orderRequest[key],
              `(${typeof data.orderRequest[key]})`
            );
          });
        }

        if (data.orderDetails && Array.isArray(data.orderDetails)) {
          console.log("OrderDetails array length:", data.orderDetails.length);
          data.orderDetails.forEach((detail, index) => {
            console.log(`  Detail ${index}:`, JSON.stringify(detail, null, 2));
          });
        }
        console.log("=== END ORDER VALIDATION ===");
      }
    } else {
      console.log("No request body");
    }

    console.log(
      "Attaching token:",
      token ? `${token.substring(0, 20)}...` : "No token"
    );
    console.log("=== END API REQUEST DEBUG ===");

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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log("401 Unauthorized - Token expired or invalid");
      console.log("Error details:", error.response);
      console.log("Request URL:", error.config?.url);
      console.log("Current token:", localStorage.getItem(AUTH_TOKEN_KEY));

      // TEMPORARILY DISABLED: Auto logout to debug
      // Call global token expired handler if available
      // if ((window as any).handleTokenExpired) {
      //   (window as any).handleTokenExpired();
      // } else {
      //   // Fallback: clear storage and redirect
      //   localStorage.removeItem(AUTH_TOKEN_KEY);
      //   localStorage.removeItem("user_data");
      //   window.location.href = "/login";
      // }
    }
    return Promise.reject(error);
  }
);

export default api;
