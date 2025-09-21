import React, { useState } from 'react';
import { App } from 'antd';
import { UserAddOutlined, IdcardOutlined, CheckCircleOutlined, StopOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import driverService from '../../../services/driver';
import type { DriverModel } from '../../../services/driver';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DriverTable from './components/DriverTable';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';

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

    const activeCount = driversData?.filter(driver => driver.status.toLowerCase() === 'active').length || 0;
    const bannedCount = driversData?.filter(driver => driver.status.toLowerCase() === 'banned').length || 0;

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

    // Status options for the modal
    const statusOptions: StatusOption[] = [
        {
            value: 'ACTIVE',
            label: 'Hoạt động',
            description: 'Tài xế có thể nhận và thực hiện đơn hàng',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: 'BANNED',
            label: 'Cấm hoạt động',
            description: 'Tài xế không thể nhận và thực hiện đơn hàng',
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
            title="Quản lý tài xế"
            icon={<IdcardOutlined />}
            description="Quản lý thông tin và trạng thái của các tài xế trong hệ thống"
            addButtonText="Thêm tài xế mới"
            addButtonIcon={<UserAddOutlined />}
            onAddClick={handleAddDriver}
            searchText={searchText}
            onSearchChange={setSearchText}
            onRefresh={refetch}
            isLoading={isLoading}
            isFetching={isFetching}
            totalCount={driversData?.length || 0}
            activeCount={activeCount}
            bannedCount={bannedCount}
            tableTitle="Danh sách tài xế"
            tableComponent={
                <DriverTable
                    data={filteredDrivers || []}
                    loading={isLoading}
                    onViewDetails={handleViewDetails}
                    onStatusChange={handleStatusChange}
                />
            }
            modalComponent={
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
            }
        />
    );
};

export default DriverPage; 