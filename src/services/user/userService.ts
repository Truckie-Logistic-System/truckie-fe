import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import type { UserModel, UsersResponse, UserResponse, RegisterEmployeeRequest, UserUpdateRequest } from './types';

/**
 * Service for handling user-related API calls
 */
const userService = {
    /**
     * Get all users
     * @returns Promise with array of users
     */
    getAllUsers: async (): Promise<UserModel[]> => {
        try {
            const response = await httpClient.get<UsersResponse>('/users');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw handleApiError(error, 'Không thể tải danh sách người dùng');
        }
    },

    /**
     * Get user by ID
     * @param id User ID
     * @returns Promise with user data
     */
    getUserById: async (id: string): Promise<UserModel> => {
        try {
            const response = await httpClient.get<UserResponse>(`/users/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching user ${id}:`, error);
            throw handleApiError(error, 'Không thể tải thông tin người dùng');
        }
    },

    /**
     * Update user status
     * @param id User ID
     * @param status New status
     * @returns Promise with updated user
     */
    updateUserStatus: async (id: string, status: string): Promise<UserModel> => {
        try {
            const response = await httpClient.patch<UserResponse>(
                `/users/status/${id}`,
                null,
                { params: { status } }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error updating user status ${id}:`, error);
            throw handleApiError(error, 'Không thể cập nhật trạng thái người dùng');
        }
    },

    /**
     * Search users by role
     * @param roleName Role name to search for
     * @returns Promise with array of users with the specified role
     */
    searchUsersByRole: async (roleName: string): Promise<UserModel[]> => {
        try {
            const response = await httpClient.get<UsersResponse>('/users/search/role', {
                params: { roleName }
            });
            return response.data.data;
        } catch (error) {
            console.error(`Error searching users by role ${roleName}:`, error);
            throw handleApiError(error, `Không thể tìm kiếm người dùng với vai trò ${roleName}`);
        }
    },

    /**
     * Register a new employee
     * @param employeeData Employee registration data
     * @returns Promise with the registered employee data
     */
    registerEmployee: async (employeeData: RegisterEmployeeRequest): Promise<UserModel> => {
        try {
            const response = await httpClient.post<UserResponse>(
                '/managers/employee/register',
                employeeData,
                { params: { roleTypeEnum: 'STAFF' } }
            );
            return response.data.data;
        } catch (error) {
            console.error('Error registering employee:', error);
            throw handleApiError(error, 'Không thể đăng ký nhân viên mới');
        }
    },

    /**
     * Update user profile
     * @param id User ID
     * @param userData User data to update
     * @returns Promise with updated user
     */
    updateUserProfile: async (id: string, userData: UserUpdateRequest): Promise<UserModel> => {
        try {
            const response = await httpClient.put<UserResponse>(`/users/${id}`, userData);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating user profile ${id}:`, error);
            throw handleApiError(error, 'Không thể cập nhật thông tin cá nhân');
        }
    }
};

export default userService; 