/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_API_TIMEOUT: string;
    readonly VITE_AUTH_ACCESS_TOKEN_KEY: string;
    readonly VITE_AUTH_REFRESH_TOKEN_KEY: string;
    readonly VITE_VIET_MAPS_API_KEY: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_DESCRIPTION: string;
    readonly VITE_SUPPORT_EMAIL: string;
    readonly VITE_SUPPORT_PHONE: string;
    readonly VITE_FEATURE_LIVE_TRACKING: string;
    readonly VITE_FEATURE_NOTIFICATIONS: string;
    readonly VITE_FEATURE_CHAT: string;
    readonly VITE_OPEN_MAP_API_KEY: string;
    readonly VITE_OPEN_MAP_API_BASE_URL: string;
    readonly VITE_TRACKASIA_MAP_API_KEY: string;
    readonly VITE_TRACKASIA_MAP_API_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
