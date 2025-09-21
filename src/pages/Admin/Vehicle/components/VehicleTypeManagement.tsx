import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Skeleton } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { vehicleService } from '../../../../services';
import type { VehicleType } from '../../../../models';
import VehicleTypeSkeleton from './VehicleTypeSkeleton';

const { Title } = Typography;

interface VehicleTypeManagementProps {
    onEdit: (vehicleType: VehicleType) => void;
}

const VehicleTypeManagement: React.FC<VehicleTypeManagementProps> = ({ onEdit }) => {
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchVehicleTypes = async () => {
        try {
            setLoading(true);
            const response = await vehicleService.getVehicleTypes();
            if (response.success) {
                setVehicleTypes(response.data || []);
            } else {
                // Không phải lỗi, chỉ là không có dữ liệu
                setVehicleTypes([]);
            }
        } catch (error) {
            console.error('Error fetching vehicle types:', error);
            setVehicleTypes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicleTypes();
    }, []);

    const columns = [
        {
            title: 'Tên loại phương tiện',
            dataIndex: 'vehicleTypeName',
            key: 'vehicleTypeName',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: VehicleType) => (
                <Space size="middle">
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record)}
                        title="Chỉnh sửa"
                    />
                </Space>
            ),
        },
    ];

    if (loading) {
        return <VehicleTypeSkeleton />;
    }

    return (
        <div>
            <Table
                dataSource={vehicleTypes}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default VehicleTypeManagement; 