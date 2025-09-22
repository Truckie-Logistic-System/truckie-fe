import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Skeleton, Badge, Tag } from 'antd';
import { EditOutlined, CarOutlined } from '@ant-design/icons';
import { vehicleService } from '../../../../services';
import type { VehicleType } from '../../../../models';
import VehicleTypeSkeleton from './VehicleTypeSkeleton';

const { Title, Text } = Typography;

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
                console.log('Vehicle types data in component:', response.data);

                // Ensure vehicleCount is a number
                const processedData = response.data.map((type: any) => ({
                    ...type,
                    vehicleCount: typeof type.vehicleCount === 'number' ? type.vehicleCount : 0
                }));

                setVehicleTypes(processedData || []);
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
            render: (text: string, record: VehicleType) => (
                <div className="flex items-center">
                    <Text strong>{text}</Text>
                </div>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Số lượng phương tiện',
            dataIndex: 'vehicleCount',
            key: 'vehicleCount',
            render: (count: number | undefined, record: VehicleType) => {
                console.log(`Vehicle count for ${record.vehicleTypeName}:`, count, typeof count);
                const vehicleCount = typeof count === 'number' ? count : 0;

                return (
                    <div className="flex items-center">
                        <Badge
                            count={vehicleCount}
                            showZero
                            overflowCount={999}
                            style={{
                                backgroundColor: vehicleCount > 0 ? '#1890ff' : '#d9d9d9',
                            }}
                        />
                        <Text className="ml-2">
                            {vehicleCount === 0 ? 'Chưa có phương tiện' : `${vehicleCount} phương tiện`}
                        </Text>
                    </div>
                );
            },
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

    console.log('Rendering vehicle types:', vehicleTypes);

    return (
        <div>
            <Table
                dataSource={vehicleTypes}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                summary={(pageData) => {
                    const totalVehicles = pageData.reduce((total, type) => {
                        const count = typeof type.vehicleCount === 'number' ? type.vehicleCount : 0;
                        return total + count;
                    }, 0);
                    console.log('Total vehicles from summary:', totalVehicles);

                    return (
                        <Table.Summary fixed>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={2}>
                                    <Text strong>Tổng số</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>
                                    <div className="flex items-center">
                                        <CarOutlined className="mr-2 text-blue-500" />
                                        <Text strong>{totalVehicles} phương tiện</Text>
                                    </div>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                            </Table.Summary.Row>
                        </Table.Summary>
                    );
                }}
            />
        </div>
    );
};

export default VehicleTypeManagement; 