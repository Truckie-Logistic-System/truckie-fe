import React, { useState } from 'react';
import { App, Card, Typography, Input, Button } from 'antd';
import { UserAddOutlined, IdcardOutlined, CheckCircleOutlined, StopOutlined, CarOutlined, SearchOutlined, ReloadOutlined, ClockCircleOutlined, LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import driverService from '../../../services/driver';
import type { DriverModel } from '../../../services/driver';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DriverTable from './components/DriverTable';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import UserStatCards from '../../../components/common/UserStatCards';
import { UserStatusEnum } from '../../../constants/enums/UserStatusEnum';

const { Title, Text } = Typography;

const DriverPage: React.FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<DriverModel | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [searchText, setSearchText] = useState('');

    const { data: driversData, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['drivers'],
        queryFn: driverService.getAllDrivers
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => driverService.updateDriverStatus(id, status),
        onSuccess: () => {
            message.success('Cập nhật trạng thái tài xế thành công');
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            setIsStatusModalVisible(false);
        },
        onError: () => {
            message.error('Cập nhật trạng thái tài xế thất bại');
        }
    });

    const handleViewDetails = (driverId: string) => {
        navigate(`/admin/drivers/${driverId}`);
    };

    const handleStatusChange = (driver: DriverModel) => {
        setSelectedDriver(driver);
        setNewStatus(driver.status);
        setIsStatusModalVisible(true);
    };

    const handleStatusUpdate = () => {
        if (selectedDriver && newStatus) {
            updateStatusMutation.mutate({ id: selectedDriver.id, status: newStatus });
        }
    };

    const handleAddDriver = () => {
        navigate('/admin/drivers/register');
    };

    const filteredDrivers = driversData?.filter(driver => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            driver.userResponse.fullName.toLowerCase().includes(searchLower) ||
            (driver.userResponse.email && driver.userResponse.email.toLowerCase().includes(searchLower)) ||
            driver.userResponse.phoneNumber.toLowerCase().includes(searchLower) ||
            driver.identityNumber.toLowerCase().includes(searchLower) ||
            driver.driverLicenseNumber.toLowerCase().includes(searchLower)
        );
    });

    // Chuyển đổi dữ liệu để sử dụng với UserStatCards
    const usersForStatCards = driversData?.map(driver => ({
        id: driver.id,
        status: driver.status
    })) || [];

    // Status handling functions
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
            description: 'Tài xế có thể nhận và thực hiện đơn hàng',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: UserStatusEnum.INACTIVE,
            label: 'Không hoạt động',
            description: 'Tài xế tạm thởi không thể nhận đơn hàng',
            color: 'default',
            icon: <StopOutlined />
        },
        {
            value: UserStatusEnum.OTP_PENDING,
            label: 'Chờ OTP',
            description: 'Tài xế đang chờ xác thực OTP',
            color: 'gold',
            icon: <ClockCircleOutlined />
        },
        {
            value: UserStatusEnum.BANNED,
            label: 'Bị cấm',
            description: 'Tài xế bị cấm sử dụng hệ thống',
            color: 'red',
            icon: <LockOutlined />
        },
        {
            value: UserStatusEnum.DELETED,
            label: 'Đã xóa',
            description: 'Tài khoản tài xế đã bị xóa',
            color: 'default',
            icon: <DeleteOutlined />
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
                            <IdcardOutlined className="mr-3 text-blue-600" /> Quản lý tài xế
                        </Title>
                        <Text type="secondary">Quản lý thông tin và trạng thái của các tài xế trong hệ thống</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={handleAddDriver}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                    >
                        Thêm tài xế mới
                    </Button>
                </div>

                {/* Hiển thị card thống kê cho tất cả các trạng thái tài xế */}
                <UserStatCards 
                    users={usersForStatCards} 
                    loading={isLoading} 
                    userType="driver"
                />

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">Danh sách tài xế</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder="Tìm kiếm theo tên, số điện thoại, CMND, bằng lái..."
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

                    <DriverTable
                        data={filteredDrivers || []}
                        loading={isLoading}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                    />
                </Card>
            </div>

            <StatusChangeModal
                visible={isStatusModalVisible}
                loading={updateStatusMutation.isPending}
                title="Cập nhật trạng thái tài xế"
                icon={<CarOutlined />}
                entityName={selectedDriver?.userResponse?.fullName || ''}
                entityDescription={selectedDriver?.userResponse?.phoneNumber || ''}
                avatarIcon={<CarOutlined />}
                currentStatus={selectedDriver?.status || ''}
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

export default DriverPage;