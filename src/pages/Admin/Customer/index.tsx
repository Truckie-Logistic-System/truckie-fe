import React, { useState } from 'react';
import { App } from 'antd';
import { ShopOutlined, UserAddOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/user';
import type { UserModel } from '../../../services/user/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CustomerTable from './components/CustomerTable';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';

const CustomerPage: React.FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<UserModel | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [searchText, setSearchText] = useState('');

    const { data: customersData, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['customers'],
        queryFn: () => userService.searchUsersByRole('CUSTOMER')
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => userService.updateUserStatus(id, status),
        onSuccess: () => {
            message.success('Cập nhật trạng thái khách hàng thành công');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsStatusModalVisible(false);
        },
        onError: () => {
            message.error('Cập nhật trạng thái khách hàng thất bại');
        }
    });

    const handleViewDetails = (customerId: string) => {
        navigate(`/admin/customers/${customerId}`);
    };

    const handleStatusChange = (customer: UserModel) => {
        setSelectedCustomer(customer);
        setNewStatus(customer.status);
        setIsStatusModalVisible(true);
    };

    const handleStatusUpdate = () => {
        if (selectedCustomer && newStatus) {
            updateStatusMutation.mutate({ id: selectedCustomer.id, status: newStatus });
        }
    };

    const filteredCustomers = customersData?.filter(customer => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            customer.fullName.toLowerCase().includes(searchLower) ||
            customer.email.toLowerCase().includes(searchLower) ||
            customer.phoneNumber.toLowerCase().includes(searchLower) ||
            customer.username.toLowerCase().includes(searchLower)
        );
    });

    const activeCount = customersData?.filter(customer => customer.status.toLowerCase() === 'active').length || 0;
    const bannedCount = customersData?.filter(customer => customer.status.toLowerCase() === 'banned').length || 0;

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
            description: 'Khách hàng có thể đặt và theo dõi đơn hàng',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: 'BANNED',
            label: 'Cấm hoạt động',
            description: 'Khách hàng không thể đăng nhập và sử dụng hệ thống',
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
            title="Quản lý khách hàng"
            icon={<ShopOutlined />}
            description="Quản lý thông tin và trạng thái của các khách hàng trong hệ thống"
            searchText={searchText}
            onSearchChange={setSearchText}
            onRefresh={refetch}
            isLoading={isLoading}
            isFetching={isFetching}
            totalCount={customersData?.length || 0}
            activeCount={activeCount}
            bannedCount={bannedCount}
            tableTitle="Danh sách khách hàng"
            tableComponent={
                <CustomerTable
                    data={filteredCustomers || []}
                    loading={isLoading}
                    onViewDetails={handleViewDetails}
                    onStatusChange={handleStatusChange}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                />
            }
            modalComponent={
                <StatusChangeModal
                    visible={isStatusModalVisible}
                    loading={updateStatusMutation.isPending}
                    title="Cập nhật trạng thái khách hàng"
                    icon={<ShopOutlined />}
                    entityName={selectedCustomer?.fullName || ''}
                    entityDescription={selectedCustomer?.email || ''}
                    avatarIcon={<ShopOutlined />}
                    currentStatus={selectedCustomer?.status || ''}
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

export default CustomerPage; 