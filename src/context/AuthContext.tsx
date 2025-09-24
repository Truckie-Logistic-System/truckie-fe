import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "@/models/User";
import authService from "@/services/auth";
import type { LoginResponse } from "@/services/auth/types";

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
        // Check if user is logged in
        const checkAuth = async () => {
            try {
                // Kiểm tra đăng nhập dựa trên thông tin người dùng trong localStorage
                const userRole = localStorage.getItem("user_role");
                const userId = localStorage.getItem("userId");
                const username = localStorage.getItem("username");
                const email = localStorage.getItem("email");

                // Nếu không có thông tin người dùng, thử refresh token
                if (!username || !userId || !email) {
                    try {
                        // Thử refresh token (sẽ tự động sử dụng cookie)
                        await authService.refreshToken();
                        // Sau khi refresh thành công, kiểm tra lại auth
                        checkAuth();
                        return;
                    } catch (refreshError) {
                        console.error("Token refresh failed during auth check:", refreshError);
                        authService.logout();
                        setIsLoading(false);
                        return;
                    }
                }

                // Tạo đối tượng user từ dữ liệu lưu trữ
                const userData: User = {
                    id: userId,
                    username: username,
                    email: email,
                    role: userRole as "admin" | "customer" | "staff" | "driver",
                };

                setUser(userData);
                setIsLoading(false);
            } catch (error) {
                console.error("Authentication check failed:", error);
                authService.logout();
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

            // Map API user to our User type
            const userData: User = {
                id: apiUser.id,
                username: apiUser.username,
                email: apiUser.email,
                role: apiUser.role.roleName.toLowerCase() as
                    | "admin"
                    | "customer"
                    | "staff"
                    | "driver",
            };

            // Store user data for future use
            localStorage.setItem("user_role", userData.role);
            localStorage.setItem("userId", userData.id);
            localStorage.setItem("username", userData.username);
            localStorage.setItem("email", userData.email);

            setUser(userData);
            return response; // Return the response for success handling
        } catch (error) {
            console.error("Login failed:", error);
            // Ensure error is propagated to the calling component
            throw error;
        }
    };

    const refreshToken = async () => {
        try {
            await authService.refreshToken();
        } catch (error) {
            console.error("Token refresh failed:", error);
            logout();
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
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
