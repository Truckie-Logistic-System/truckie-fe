/**
 * Environment configuration
 * This file centralizes all environment variables and provides type safety
 */

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL;
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT);

// Authentication
export const AUTH_ACCESS_TOKEN_KEY = import.meta.env.AUTH_ACCESS_TOKEN_KEY;
export const AUTH_REFRESH_TOKEN_KEY = import.meta.env
  .VITE_AUTH_REFRESH_TOKEN_KEY;

// Map Configuration
export const VIET_MAPS_API_KEY = import.meta.env.VITE_VIET_MAPS_API_KEY;
export const OPEN_MAP_API_KEY = import.meta.env.VITE_OPEN_MAP_API_KEY;
export const OPEN_MAP_API_BASE_URL = import.meta.env.VITE_OPEN_MAP_API_BASE_URL;
export const TRACKASIA_MAP_API_KEY = import.meta.env.VITE_TRACKASIA_MAP_API_KEY;
export const TRACKASIA_MAP_API_BASE_URL = import.meta.env
  .VITE_TRACKASIA_MAP_API_BASE_URL;

// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME;
export const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION;
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL;
export const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE;

// Feature Flags
export const FEATURES = {
  LIVE_TRACKING: import.meta.env.VITE_FEATURE_LIVE_TRACKING === "true",
  NOTIFICATIONS: import.meta.env.VITE_FEATURE_NOTIFICATIONS === "true",
  CHAT: import.meta.env.VITE_FEATURE_CHAT === "true",
};
