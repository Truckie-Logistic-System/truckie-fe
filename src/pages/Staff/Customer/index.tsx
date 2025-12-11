import React, { useState } from 'react';
import { App } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import userService from '../../../services/user';
import type { UserModel } from '../../../services/user/types';
import { useQuery } from '@tanstack/react-query';
import CustomerTable from './components/CustomerTable';
import CustomerOverviewModal from '../../../pages/Admin/Chat/components/CustomerOverviewModal';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';

const StaffCustomerPage: React.FC = () => {
    const { message } = App.useApp();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    const { data: customersData, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['customers'],
        queryFn: () => userService.searchUsersByRole('CUSTOMER')
    });

    const handleViewCustomerDetails = (customerId: string) => {
        setSelectedCustomerId(customerId);
        setIsCustomerModalVisible(true);
    };

    const handleCloseCustomerModal = () => {
        setIsCustomerModalVisible(false);
        setSelectedCustomerId(null);
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

    // Status handling functions (read-only)
    const getStatusColor = (status: string | boolean) => {
        if (typeof status === 'string') {
            switch (status.toLowerCase()) {
                case 'active':
                    return 'green';
                case 'inactive':
                    return 'default';
                case 'banned':
                    return 'red';
                default:
                    return 'default';
            }
        }
        return 'default';
    };

    const getStatusText = (status: string | boolean) => {
        if (typeof status === 'string') {
            switch (status.toLowerCase()) {
                case 'active':
                    return 'Hoạt động';
                case 'inactive':
                    return 'Không hoạt động';
                case 'banned':
                    return 'Bị cấm';
                default:
                    return status || 'Không xác định';
            }
        }
        return 'Không xác định';
    };

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
        <>
            <EntityManagementLayout
                title="Danh sách khách hàng"
                icon={<ShopOutlined />}
                description="Xem thông tin và lịch sử của các khách hàng trong hệ thống"
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
                        onViewDetails={handleViewCustomerDetails}
                        getStatusColor={getStatusColor}
                        getStatusText={getStatusText}
                    />
                }
                modalComponent={null} // No modal for staff since they can't update
            />
            
            {/* Customer Overview Modal */}
            {isCustomerModalVisible && selectedCustomerId && (
                <CustomerOverviewModal
                    customerId={selectedCustomerId}
                    onClose={handleCloseCustomerModal}
                />
            )}
        </>
    );
};

export default StaffCustomerPage;
