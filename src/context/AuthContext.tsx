import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "@/models/User";
import authService from "@/services/auth";
import type { LoginResponse } from "@/services/auth/types";
import { onLogout as onHttpClientLogout } from "@/services/api/httpClient";
import { issueWebSocket } from "@/services/websocket/issueWebSocket";
import { notificationService } from "@/services/notificationService";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<LoginResponse>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    getRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Listen for logout events from httpClient
        const unsubscribe = onHttpClientLogout(() => {
            setUser(null);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = async () => {
            try {
                // Initialize auth state first - this will attempt to refresh the token if needed
                await authService.initAuth();

                // Check if we're authenticated after initialization
                const isLoggedIn = authService.isLoggedIn();

                if (!isLoggedIn) {
                    setIsLoading(false);
                    return;
                }

                // Get user data from sessionStorage first, then fallback to localStorage
                let userRole = sessionStorage.getItem("user_role");
                let userId = sessionStorage.getItem("userId");
                let username = sessionStorage.getItem("username");
                let email = sessionStorage.getItem("email");
                
                // If not in sessionStorage, check localStorage (for server restart scenarios)
                if (!userRole || !userId) {
                    userRole = localStorage.getItem("user_role");
                    userId = localStorage.getItem("userId");
                    username = localStorage.getItem("username");
                    email = localStorage.getItem("email");
                    
                    // Restore to sessionStorage if found in localStorage
                    if (userRole && userId) {
                        sessionStorage.setItem("user_role", userRole);
                        sessionStorage.setItem("userId", userId);
                        if (username) sessionStorage.setItem("username", username);
                        if (email) sessionStorage.setItem("email", email);
                    }
                }

                // Validate user data
                if (!userRole || !userId || !username || !email) {
                    console.error("Missing user data in localStorage");
                    authService.logout();
                    setIsLoading(false);
                    return;
                }

                // Create user object from stored data
                const userData: User = {
                    id: userId,
                    username: username,
                    email: email,
                    role: userRole as "admin" | "customer" | "staff" | "driver",
                };

                setUser(userData);
                setIsLoading(false);
            } catch (error: any) {
                console.error("Authentication check failed:", error);

                // ONLY logout if it's a revoked token error (401/403)
                // For other errors (network, server error, etc), just stay logged in
                const errorMessage = error?.message || '';
                const isRevokedTokenError = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('hết hạn');

                if (isRevokedTokenError) {
                    console.warn('[AuthContext] Token revoked, logging out');
                    authService.logout();
                } else {
                    console.warn('[AuthContext] Token refresh failed due to network/server error, keeping user logged in');
                    // Try to restore user from sessionStorage first, then localStorage
                    let userRole = sessionStorage.getItem("user_role");
                    let userId = sessionStorage.getItem("userId");
                    let username = sessionStorage.getItem("username");
                    let email = sessionStorage.getItem("email");
                    
                    // Fallback to localStorage if sessionStorage is empty
                    if (!userRole || !userId) {
                        userRole = localStorage.getItem("user_role");
                        userId = localStorage.getItem("userId");
                        username = localStorage.getItem("username");
                        email = localStorage.getItem("email");
                    }

                    if (userRole && userId && username && email) {
                        const userData: User = {
                            id: userId,
                            username: username,
                            email: email,
                            role: userRole as "admin" | "customer" | "staff" | "driver",
                        };
                        setUser(userData);
                    }
                }

                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            // Call the authentication API
            const response = await authService.login(username, password);

            // If we get here, the login was successful
            const apiUser = response.data.user;
            const roleName = apiUser.role?.roleName?.toLowerCase();

            if (!roleName) {
                throw new Error("Vai trò người dùng không hợp lệ");
            }

            // Map API user to our User type
            const userData: User = {
                id: apiUser.id,
                username: apiUser.username,
                email: apiUser.email,
                role: roleName as "admin" | "customer" | "staff" | "driver",
            };

            setUser(userData);
            return response; // Return the response for success handling
        } catch (error) {
            console.error("Login failed:", error);
            // Ensure error is propagated to the calling component
            throw error;
        }
    };

    const refreshToken = async () => {
        setIsLoading(true);
        try {
            await authService.refreshToken();
        } catch (error) {
            console.error("Token refresh failed:", error);
            logout();
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setIsLoading(true);
        
        // Disconnect all WebSocket connections
        console.log('[AuthContext] Disconnecting WebSocket connections on logout');
        try {
            issueWebSocket.disconnect();
        } catch (error) {
            console.error('[AuthContext] Error disconnecting issueWebSocket:', error);
        }
        
        try {
            notificationService.disconnect();
        } catch (error) {
            console.error('[AuthContext] Error disconnecting notificationService:', error);
        }
        
        authService.logout();
        setUser(null);
        setIsLoading(false);
    };

    // Xác định đường dẫn chuyển hướng dựa trên vai trò người dùng
    const getRedirectPath = (): string => {
        if (!user) return "/auth/login";

        switch (user.role) {
            case "admin":
                return "/admin/dashboard";
            case "staff":
                return "/staff/dashboard";
            case "driver":
                return "/driver/dashboard";
            case "customer":
                return "/"; // Chuyển hướng customer đến trang chủ
            default:
                return "/";
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshToken,
        getRedirectPath,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};