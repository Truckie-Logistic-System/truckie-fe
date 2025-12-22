import React, { useState, useRef } from 'react';
import { App } from 'antd';
import { TagsOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { OrderSize } from '../../../models/OrderSize';
import { orderSizeService } from '../../../services';
import OrderSizeList from './components/OrderSizeList';
import type { OrderSizeListRef } from './components/OrderSizeList';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';

const OrderSizeManagement: React.FC = () => {
    const { message } = App.useApp();
    const [searchText, setSearchText] = useState('');
    const orderSizeListRef = useRef<OrderSizeListRef>(null);

    // Fetch order sizes
    const {
        data: orderSizesData,
        isLoading,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ['orderSizes'],
        queryFn: orderSizeService.getAllOrderSizes
    });

    const handleRefresh = () => {
        refetch();
    };

    // Filter order sizes based on search text
    const filteredOrderSizes = orderSizesData?.filter(orderSize => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            (orderSize.description && orderSize.description.toLowerCase().includes(searchLower)) ||
            orderSize.status.toLowerCase().includes(searchLower) ||
            `${orderSize.minLength}x${orderSize.minWidth}x${orderSize.minHeight}`.includes(searchLower) ||
            `${orderSize.maxLength}x${orderSize.maxWidth}x${orderSize.maxHeight}`.includes(searchLower)
        );
    }) || [];

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

    // Count status
    const activeCount = filteredOrderSizes.filter(os => os.status === 'ACTIVE').length;
    const deletedCount = filteredOrderSizes.filter(os => os.status === 'DELETED').length;

    return (
        <EntityManagementLayout
            title="Quản lý kích thước kiện hàng"
            icon={<TagsOutlined />}
            description="Quản lý các kích thước tiêu chuẩn cho kiện hàng trong hệ thống vận chuyển"
            addButtonText="Thêm kích thước mới"
            addButtonIcon={<PlusOutlined />}
            onAddClick={() => {
                if (orderSizeListRef.current) {
                    orderSizeListRef.current.showAddModal();
                }
            }}
            searchText={searchText}
            onSearchChange={setSearchText}
            onRefresh={handleRefresh}
            isLoading={isLoading}
            isFetching={isFetching}
            totalCount={filteredOrderSizes.length}
            activeCount={activeCount}
            bannedCount={deletedCount}
            tableTitle="Danh sách kích thước kiện hàng"
            tableComponent={
                <OrderSizeList
                    ref={orderSizeListRef}
                    orderSizes={filteredOrderSizes}
                    loading={isLoading}
                    onRefresh={refetch}
                />
            }
            modalComponent={null}
            searchPlaceholder="Tìm kiếm theo mô tả, kích thước..."
            activeCardTitle="Kích thước đang sử dụng"
            bannedCardTitle="Kích thước đã xóa"
        />
    );
};

export default OrderSizeManagement;
