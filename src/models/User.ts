// User model
export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'customer' | 'driver' | 'staff';
}

export interface UserCredentials {
    username: string;
    password: string;
}

export interface UserResponse {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    phoneNumber?: string;
    gender?: boolean;
    dateOfBirth?: string;
    imageUrl?: string;
    status?: string;
    role: {
        roleName: string;
        permissions?: string[];
    };
}

// Chuyển đổi từ API response sang model
export const mapUserResponseToModel = (apiUser: UserResponse): User => {
    return {
        id: apiUser.id,
        username: apiUser.username,
        email: apiUser.email,
        role: apiUser.role.roleName.toLowerCase() as 'admin' | 'customer' | 'staff' | 'driver'
    };
};

// Kiểm tra xem user có quyền truy cập vào route không
export const hasAccess = (user: User | null, allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
};

// Lấy đường dẫn chuyển hướng dựa trên vai trò
export const getRedirectPathByRole = (user: User | null): string => {
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