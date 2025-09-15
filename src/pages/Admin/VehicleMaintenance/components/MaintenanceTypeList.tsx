import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Table, Button, Space, App, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, SwapOutlined, CheckCircleOutlined, StopOutlined, ToolOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { MaintenanceTypeEntity } from '../../../../models';
import { maintenanceTypeService } from '../../../../services/maintenance-type';
import MaintenanceTypeModal from './MaintenanceTypeModal';
import StatusChangeModal from '../../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../../components/common/StatusChangeModal';
import { MaintenanceTypeTag } from '@/components/common/tags';

export interface MaintenanceTypeListRef {
    showAddModal: () => void;
}

const MaintenanceTypeList = forwardRef<MaintenanceTypeListRef, {}>((props, ref) => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<MaintenanceTypeEntity | null>(null);

    // Status change modal state
    const [isStatusModalVisible, setIsStatusModalVisible] = useState<boolean>(false);
    const [selectedMaintenanceType, setSelectedMaintenanceType] = useState<MaintenanceTypeEntity | null>(null);
    const [newStatus, setNewStatus] = useState<boolean>(true);
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);

    // Expose the showModal function to parent component
    useImperativeHandle(ref, () => ({
        showAddModal: () => {
            setSelectedType(null);
            setIsModalOpen(true);
        }
    }));

    const { data: maintenanceTypesResponse, isLoading, error } = useQuery({
        queryKey: ['maintenanceTypes'],
        queryFn: maintenanceTypeService.getMaintenanceTypes,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { isActive: boolean } }) =>
            maintenanceTypeService.updateMaintenanceType(id, data as any),
        onSuccess: () => {
            message.success('Đã cập nhật trạng thái loại bảo dưỡng');
            queryClient.invalidateQueries({ queryKey: ['maintenanceTypes'] });
        },
        onError: (error: any) => {
            message.error(error.message || 'Không thể cập nhật trạng thái');
        },
    });

    const handleEditType = (record: MaintenanceTypeEntity) => {
        setSelectedType(record);
        setIsModalOpen(true);
    };

    const handleStatusChange = (record: MaintenanceTypeEntity) => {
        setSelectedMaintenanceType(record);
        setNewStatus(!record.isActive);
        setIsStatusModalVisible(true);
    };

    const handleStatusUpdate = async () => {
        if (selectedMaintenanceType) {
            setStatusUpdateLoading(true);
            try {
                await statusMutation.mutateAsync({
                    id: selectedMaintenanceType.id,
                    data: { isActive: newStatus }
                });
                setIsStatusModalVisible(false);
            } catch (error) {
                console.error('Error updating maintenance type status:', error);
            } finally {
                setStatusUpdateLoading(false);
            }
        }
    };

    const getStatusColor = (status: string | boolean) => {
        if (typeof status === 'boolean') {
            return status ? 'green' : 'red';
        }
        return 'default';
    };

    const getStatusText = (status: string | boolean) => {
        if (typeof status === 'boolean') {
            return status ? 'Đang hoạt động' : 'Không hoạt động';
        }
        return 'Không xác định';
    };

    // Status options for the modal
    const statusOptions: StatusOption[] = [
        {
            value: true,
            label: 'Hoạt động',
            description: 'Loại bảo dưỡng có thể được sử dụng',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: false,
            label: 'Không hoạt động',
            description: 'Loại bảo dưỡng không thể được sử dụng',
            color: 'red',
            icon: <StopOutlined />
        }
    ];

    const columns: ColumnsType<MaintenanceTypeEntity> = [
        {
            title: 'Tên loại bảo dưỡng',
            dataIndex: 'maintenanceTypeName',
            key: 'maintenanceTypeName',
            sorter: (a, b) => a.maintenanceTypeName.localeCompare(b.maintenanceTypeName),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <MaintenanceTypeTag status={isActive} />
            ),
            filters: [
                { text: 'Hoạt động', value: true },
                { text: 'Không hoạt động', value: false },
            ],
            onFilter: (value, record) => record.isActive === value,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditType(record)}
                    />
                    <Button
                        icon={<SwapOutlined />}
                        onClick={() => handleStatusChange(record)}
                        className={record.isActive ? 'border-red-400 text-red-500 hover:text-red-600 hover:border-red-500' : 'border-green-400 text-green-500 hover:text-green-600 hover:border-green-500'}
                    >
                        {record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </Button>
                </Space>
            ),
        },
    ];

    if (error) {
        return <div className="text-red-500">Đã xảy ra lỗi khi tải dữ liệu: {(error as Error).message}</div>;
    }

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    // Check if data is available in the new response structure
    const maintenanceTypes = maintenanceTypesResponse?.data || [];
    const hasData = maintenanceTypes.length > 0;

    return (
        <div>
            {!hasData && !isLoading ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Chưa có loại bảo dưỡng nào</p>
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={maintenanceTypes}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Không có dữ liệu' }}
                />
            )}

            <MaintenanceTypeModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                maintenanceType={selectedType}
            />

            {/* Status Change Modal */}
            <StatusChangeModal
                visible={isStatusModalVisible}
                loading={statusUpdateLoading}
                title="Cập nhật trạng thái loại bảo dưỡng"
                icon={<ToolOutlined />}
                entityName={selectedMaintenanceType?.maintenanceTypeName || ''}
                entityDescription={selectedMaintenanceType?.description || ''}
                avatarIcon={<ToolOutlined />}
                currentStatus={selectedMaintenanceType?.isActive ?? false}
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
});

export default MaintenanceTypeList; 