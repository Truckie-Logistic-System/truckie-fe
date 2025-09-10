import React, { useState } from 'react';
import { App } from 'antd';
import { ShopOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/user';
import type { UserModel } from '../../../services/user/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CustomerTable from './components/CustomerTable';
import StatusChangeModal from './components/StatusChangeModal';
import UserManagementLayout from '../../../components/features/admin/UserManagementLayout';

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
        <UserManagementLayout
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
                />
            }
            modalComponent={
                <StatusChangeModal
                    visible={isStatusModalVisible}
                    loading={updateStatusMutation.isPending}
                    customer={selectedCustomer}
                    status={newStatus}
                    onStatusChange={setNewStatus}
                    onOk={handleStatusUpdate}
                    onCancel={() => setIsStatusModalVisible(false)}
                />
            }
        />
    );
};

export default CustomerPage; 