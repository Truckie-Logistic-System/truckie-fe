export interface Role {
    id: string;
    roleName: string;
    description: string;
    isActive: boolean;
}

export interface UserModel {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl: string;
    status: string;
    role: Role;
}

export interface UsersResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: UserModel[];
}

// Sửa lại UserResponse để phù hợp với API thực tế
export interface UserResponse {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl: string;
    status: string;
    role: Role;
}

export interface UserStatusUpdateRequest {
    status: string;
}

export interface RegisterEmployeeRequest {
    username: string;
    email: string;
    password: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl?: string;
    fullName: string;
    phoneNumber: string;
}

// For backward compatibility with existing code
export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'customer' | 'staff' | 'driver';
}

export interface UserCredentials {
    username: string;
    password: string;
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