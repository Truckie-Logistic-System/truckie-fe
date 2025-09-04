import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/models/User';
import { AUTH_ACCESS_TOKEN_KEY } from '@/config';
import authService from '@/services/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
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
                const token = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                // TODO: Implement API call to get user profile
                // For now, we'll just simulate a user based on stored role
                const userRole = localStorage.getItem('user_role') || 'customer';

                const userData: User = {
                    id: '1',
                    username: 'demo_user',
                    email: 'demo@example.com',
                    role: userRole as 'admin' | 'customer' | 'staff' | 'driver'
                };

                setUser(userData);
                setIsLoading(false);
            } catch (error) {
                console.error('Authentication check failed:', error);
                authService.logout();
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            // Call the authentication API
            const response = await authService.login(username, password);

            if (response.success) {
                const apiUser = response.data.user;

                // Map API user to our User type
                const userData: User = {
                    id: apiUser.id,
                    username: apiUser.username,
                    email: apiUser.email,
                    role: apiUser.role.roleName.toLowerCase() as 'admin' | 'customer' | 'staff' | 'driver'
                };

                // Store role for future use
                localStorage.setItem('user_role', userData.role);

                setUser(userData);
            } else {
                throw new Error(response.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    // Xác định đường dẫn chuyển hướng dựa trên vai trò người dùng
    const getRedirectPath = (): string => {
        if (!user) return '/auth/login';

        switch (user.role) {
            case 'admin':
                return '/admin/dashboard';
            case 'staff':
                return '/staff/dashboard';
            case 'driver':
                return '/driver/dashboard';
            case 'customer':
                return '/'; // Chuyển hướng customer đến trang chủ
            default:
                return '/';
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        getRedirectPath
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 