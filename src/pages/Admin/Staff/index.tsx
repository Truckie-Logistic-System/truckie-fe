import React, { useState, useEffect } from 'react';
import { App, Card, Typography, Input, Button } from 'antd';
import { TeamOutlined, UserAddOutlined, CheckCircleOutlined, StopOutlined, SearchOutlined, ReloadOutlined, ClockCircleOutlined, LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/user';
import type { UserModel } from '../../../services/user/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StaffTable from './components/StaffTable';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import UserStatCards from '../../../components/common/UserStatCards';
import { UserStatusEnum } from '../../../constants/enums/UserStatusEnum';

const { Title, Text } = Typography;

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

    // Chuyển đổi dữ liệu để sử dụng với UserStatCards
    const usersForStatCards = staffData?.map(staff => ({
        id: staff.id,
        status: staff.status
    })) || [];

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

    // Status options for the modal - đầy đủ theo UserStatusEnum
    const statusOptions: StatusOption[] = [
        {
            value: UserStatusEnum.ACTIVE,
            label: 'Hoạt động',
            description: 'Nhân viên có thể đăng nhập và sử dụng hệ thống',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: UserStatusEnum.INACTIVE,
            label: 'Không hoạt động',
            description: 'Nhân viên tạm thời không thể đăng nhập và sử dụng hệ thống',
            color: 'default',
            icon: <StopOutlined />
        },
        {
            value: UserStatusEnum.OTP_PENDING,
            label: 'Chờ OTP',
            description: 'Nhân viên đang chờ xác thực OTP',
            color: 'gold',
            icon: <StopOutlined />
        },
        {
            value: UserStatusEnum.BANNED,
            label: 'Bị cấm',
            description: 'Nhân viên bị cấm sử dụng hệ thống',
            color: 'red',
            icon: <StopOutlined />
        },
        {
            value: UserStatusEnum.DELETED,
            label: 'Đã xóa',
            description: 'Tài khoản nhân viên đã bị xóa',
            color: 'default',
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
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <TeamOutlined className="mr-3 text-blue-600" /> Quản lý nhân viên
                        </Title>
                        <Text type="secondary">Quản lý thông tin và trạng thái của các nhân viên trong hệ thống</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={handleAddStaff}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                    >
                        Thêm nhân viên mới
                    </Button>
                </div>

                {/* Hiển thị card thống kê cho tất cả các trạng thái nhân viên */}
                <UserStatCards 
                    users={usersForStatCards} 
                    loading={isLoading} 
                    userType="staff"
                />

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">Danh sách nhân viên</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder="Tìm kiếm theo tên, email, tên đăng nhập, số điện thoại..."
                                prefix={<SearchOutlined />}
                                className="w-full md:w-80"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                disabled={isLoading}
                            />
                            <Button
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={() => refetch()}
                                title="Làm mới dữ liệu"
                                loading={isFetching}
                            />
                        </div>
                    </div>

                    <StaffTable
                        data={filteredStaff || []}
                        loading={isLoading}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                    />
                </Card>
            </div>

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
        </div>
    );
};

export default StaffPage;