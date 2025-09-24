import React, { useState, useEffect } from 'react';
import { App } from 'antd';
import { TeamOutlined, UserAddOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/user';
import type { UserModel } from '../../../services/user/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StaffTable from './components/StaffTable';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';
import { UserStatusEnum } from '@/constants/enums';
import { UserStatusTag } from '@/components/common/tags';

const StaffPage: React.FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<UserModel | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [searchText, setSearchText] = useState('');

    const { data: staffData, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['staff'],
        queryFn: () => userService.searchUsersByRole('STAFF')
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => userService.updateUserStatus(id, status),
        onSuccess: () => {
            message.success('Cập nhật trạng thái nhân viên thành công');
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setIsStatusModalVisible(false);
        },
        onError: () => {
            message.error('Cập nhật trạng thái nhân viên thất bại');
        }
    });

    const handleViewDetails = (staffId: string) => {
        navigate(`/admin/staff/${staffId}`);
    };

    const handleStatusChange = (staff: UserModel) => {
        setSelectedStaff(staff);
        setNewStatus(staff.status);
        setIsStatusModalVisible(true);
    };

    const handleStatusUpdate = () => {
        if (selectedStaff && newStatus) {
            updateStatusMutation.mutate({ id: selectedStaff.id, status: newStatus });
        }
    };

    const handleAddStaff = () => {
        navigate('/admin/staff/register');
    };

    const filteredStaff = staffData?.filter(staff => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            staff.fullName.toLowerCase().includes(searchLower) ||
            staff.email.toLowerCase().includes(searchLower) ||
            staff.phoneNumber.toLowerCase().includes(searchLower) ||
            staff.username.toLowerCase().includes(searchLower)
        );
    });

    const activeCount = staffData?.filter(staff => staff.status.toLowerCase() === 'active').length || 0;
    const bannedCount = staffData?.filter(staff => staff.status.toLowerCase() === 'banned').length || 0;

    // Hàm chuyển đổi status sang UserStatusEnum
    const mapToUserStatusEnum = (status: string | boolean): UserStatusEnum => {
        if (typeof status === 'boolean') {
            return status ? UserStatusEnum.ACTIVE : UserStatusEnum.BANNED;
        }

        switch (String(status).toLowerCase()) {
            case 'active':
                return UserStatusEnum.ACTIVE;
            case 'banned':
                return UserStatusEnum.BANNED;
            default:
                return UserStatusEnum.ACTIVE;
        }
    };

    // Status handling functions - giữ lại để tương thích với StatusChangeModal
    const getStatusColor = (status: string | boolean) => {
        if (typeof status === 'string') {
            switch (status.toLowerCase()) {
                case 'active': return 'green';
                case 'banned': return 'red';
                default: return 'default';
            }
        }
        return 'default';
    };

    const getStatusText = (status: string | boolean) => {
        if (typeof status === 'string') {
            switch (status.toLowerCase()) {
                case 'active': return 'Hoạt động';
                case 'banned': return 'Bị cấm';
                default: return status || 'Không xác định';
            }
        }
        return 'Không xác định';
    };

    // Status options for the modal
    const statusOptions: StatusOption[] = [
        {
            value: 'ACTIVE',
            label: 'Hoạt động',
            description: 'Nhân viên có thể đăng nhập và sử dụng hệ thống',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: 'BANNED',
            label: 'Cấm hoạt động',
            description: 'Nhân viên không thể đăng nhập và sử dụng hệ thống',
            color: 'red',
            icon: <StopOutlined />
        }
    ];

    if (error) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-64">
                <p className="text-red-500 text-xl mb-4">Đã xảy ra lỗi khi tải dữ liệu</p>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => refetch()}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <EntityManagementLayout
            title="Quản lý nhân viên"
            icon={<TeamOutlined />}
            description="Quản lý thông tin và trạng thái của các nhân viên trong hệ thống"
            addButtonText="Thêm nhân viên mới"
            addButtonIcon={<UserAddOutlined />}
            onAddClick={handleAddStaff}
            searchText={searchText}
            onSearchChange={setSearchText}
            onRefresh={refetch}
            isLoading={isLoading}
            isFetching={isFetching}
            totalCount={staffData?.length || 0}
            activeCount={activeCount}
            bannedCount={bannedCount}
            tableTitle="Danh sách nhân viên"
            tableComponent={
                <StaffTable
                    data={filteredStaff || []}
                    loading={isLoading}
                    onViewDetails={handleViewDetails}
                    onStatusChange={handleStatusChange}
                />
            }
            modalComponent={
                <StatusChangeModal
                    visible={isStatusModalVisible}
                    loading={updateStatusMutation.isPending}
                    title="Cập nhật trạng thái nhân viên"
                    icon={<TeamOutlined />}
                    entityName={selectedStaff?.fullName || ''}
                    entityDescription={selectedStaff?.email || ''}
                    avatarIcon={<TeamOutlined />}
                    currentStatus={selectedStaff?.status || ''}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    statusOptions={statusOptions}
                    selectedStatus={newStatus}
                    onStatusChange={setNewStatus}
                    onOk={handleStatusUpdate}
                    onCancel={() => setIsStatusModalVisible(false)}
                />
            }
        />
    );
};

export default StaffPage; 