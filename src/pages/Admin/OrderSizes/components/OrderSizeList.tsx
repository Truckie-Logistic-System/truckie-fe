import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Table, Button, Tag, Space, Tooltip, Typography, App, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { OrderSize } from '../../../../models/OrderSize';
import { orderSizeService } from '../../../../services';
import OrderSizeModal from './OrderSizeModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const { Text } = Typography;
const { confirm } = Modal;

interface OrderSizeListProps {
    orderSizes: OrderSize[];
    loading: boolean;
    onRefresh: () => void;
}

export interface OrderSizeListRef {
    showAddModal: () => void;
}

const OrderSizeList = forwardRef<OrderSizeListRef, OrderSizeListProps>(({
    orderSizes,
    loading,
    onRefresh
}, ref) => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingOrderSize, setEditingOrderSize] = useState<OrderSize | null>(null);

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: orderSizeService.deleteOrderSize,
        onSuccess: () => {
            message.success('Xóa kích thước thành công');
            queryClient.invalidateQueries({ queryKey: ['orderSizes'] });
            onRefresh();
        },
        onError: (error: any) => {
            message.error(error?.message || 'Có lỗi xảy ra khi xóa kích thước');
        }
    });

    useImperativeHandle(ref, () => ({
        showAddModal: () => {
            setEditingOrderSize(null);
            setModalVisible(true);
        }
    }));

    const handleEdit = (record: OrderSize) => {
        setEditingOrderSize(record);
        setModalVisible(true);
    };

    const handleDelete = (record: OrderSize) => {
        confirm({
            title: 'Xác nhận xóa kích thước',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn xóa kích thước này không?</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                        <Text strong>Kích thước:</Text> {record.minLength}×{record.minWidth}×{record.minHeight} - {record.maxLength}×{record.maxWidth}×{record.maxHeight} cm<br/>
                        <Text strong>Mô tả:</Text> {record.description}
                    </div>
                    <p className="mt-2 text-red-600">
                        <ExclamationCircleOutlined /> Thao tác này không thể hoàn tác!
                    </p>
                </div>
            ),
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                deleteMutation.mutate(record.id);
            },
        });
    };

    const formatDimensions = (orderSize: OrderSize) => {
        const minDimensions = `${orderSize.minLength}×${orderSize.minWidth}×${orderSize.minHeight}`;
        const maxDimensions = `${orderSize.maxLength}×${orderSize.maxWidth}×${orderSize.maxHeight}`;
        
        return (
            <div>
                <div><Text strong>Tối thiểu:</Text> {minDimensions} cm</div>
                <div><Text strong>Tối đa:</Text> {maxDimensions} cm</div>
            </div>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'green';
            case 'DELETED':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'Hoạt động';
            case 'DELETED':
                return 'Đã xóa';
            default:
                return status;
        }
    };

    const columns: ColumnsType<OrderSize> = [
        {
            title: 'Kích thước (L×W×H)',
            dataIndex: 'dimensions',
            key: 'dimensions',
            render: (_, record) => formatDimensions(record),
            width: 220,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: {
                showTitle: false,
            },
            render: (description) => (
                <Tooltip placement="topLeft" title={description}>
                    {description || <Text type="secondary">Không có mô tả</Text>}
                </Tooltip>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
            filters: [
                { text: 'Hoạt động', value: 'ACTIVE' },
                { text: 'Đã xóa', value: 'DELETED' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            disabled={record.status === 'DELETED'}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                            disabled={record.status === 'DELETED'}
                            loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Table
                columns={columns}
                dataSource={orderSizes}
                rowKey="id"
                loading={loading}
                pagination={{
                    total: orderSizes.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} của ${total} kích thước`,
                }}
                scroll={{ x: 800 }}
            />

            <OrderSizeModal
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingOrderSize(null);
                }}
                onSuccess={() => {
                    setModalVisible(false);
                    setEditingOrderSize(null);
                    onRefresh();
                }}
                orderSize={editingOrderSize}
            />
        </>
    );
});

OrderSizeList.displayName = 'OrderSizeList';

export default OrderSizeList;
