import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { GetVehicleMaintenanceDetailResponse } from '../../../services/vehicle/types';
import { Card, Descriptions, Button, Skeleton, Divider, Tag, App, Row, Col } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CarOutlined, ToolOutlined, TagOutlined } from '@ant-design/icons';

import vehicleService from '../../../services/vehicle/vehicleService';
import { formatCurrency } from '../../../utils/formatters';
import { VehicleStatusEnum } from '@/constants/enums';
import { VehicleStatusTag, CommonStatusTag } from '@/components/common/tags';

const VehicleMaintenanceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { message } = App.useApp();

    const { data, isLoading, error } = useQuery({
        queryKey: ['vehicleMaintenance', id],
        queryFn: () => id ? vehicleService.getVehicleMaintenanceById(id) : Promise.reject('ID không hợp lệ'),
        enabled: !!id
    });

    // Log the response to help debug vehicle type information
    React.useEffect(() => {
        if (data) {
            console.log('Vehicle maintenance detail response:', data);
            if (data.data?.vehicleEntity) {
                console.log('Vehicle entity:', data.data.vehicleEntity);
            }
        }
    }, [data]);

    const maintenance = data?.data;

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                {/* Header skeleton */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <Skeleton.Button active size="default" className="mr-4" />
                        <Skeleton.Input active style={{ width: 300 }} />
                    </div>
                    <Skeleton.Button active size="default" />
                </div>

                {/* Main content skeleton */}
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card title={<Skeleton.Input active style={{ width: 150 }} size="small" />} className="mb-6">
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </Card>
                    </Col>

                    <Col span={24}>
                        <Card title={<Skeleton.Input active style={{ width: 100 }} size="small" />} className="mb-6">
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </Card>
                    </Col>

                    <Col span={24}>
                        <Divider />
                        <Card title={<Skeleton.Input active style={{ width: 180 }} size="small" />} className="mb-6">
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </Card>
                    </Col>

                    <Col span={24}>
                        <Card title={<Skeleton.Input active style={{ width: 200 }} size="small" />}>
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    if (error || !maintenance) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin bảo dưỡng';
        message.error(errorMessage);
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-red-500 mb-4">{errorMessage}</div>
                <Link to="/admin/vehicle-maintenances">
                    <Button type="primary" icon={<ArrowLeftOutlined />}>Quay lại danh sách</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Link to="/admin/vehicle-maintenances">
                        <Button icon={<ArrowLeftOutlined />} className="mr-4">Quay lại</Button>
                    </Link>
                    <h2 className="text-2xl font-bold m-0">Chi tiết bảo dưỡng</h2>
                </div>
                <Link to={`/admin/vehicle-maintenances/edit/${id}`}>
                    <Button type="primary" icon={<EditOutlined />}>Chỉnh sửa</Button>
                </Link>
            </div>

            <Card
                title={
                    <div className="flex items-center">
                        <ToolOutlined className="mr-2 text-blue-500" />
                        <span>Thông tin bảo dưỡng</span>
                    </div>
                }
                className="mb-6"
            >
                <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="Ngày bảo dưỡng">
                        {maintenance.actualDate || maintenance.plannedDate
                            ? new Date(maintenance.actualDate || maintenance.plannedDate as string).toLocaleDateString('vi-VN')
                            : 'Chưa xác định'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chi phí">
                        {/* Backend chưa cung cấp trường chi phí, hiển thị fallback */}
                        Chưa có thông tin
                    </Descriptions.Item>

                    <Descriptions.Item label="Số đồng hồ công-tơ-mét">
                        {maintenance.odometerReading ? `${maintenance.odometerReading} km` : 'Không có'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trung tâm dịch vụ">
                        {(maintenance as any).notes || 'Không có'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày bảo dưỡng tiếp theo">
                        {maintenance.nextServiceDate
                            ? new Date(maintenance.nextServiceDate).toLocaleDateString('vi-VN')
                            : 'Chưa xác định'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại dịch vụ">
                        <Tag color="blue">{maintenance.serviceType || 'Không xác định'}</Tag>
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card
                title={
                    <div className="flex items-center">
                        <TagOutlined className="mr-2 text-blue-500" />
                        <span>Mô tả</span>
                    </div>
                }
                className="mb-6"
            >
                <p className="whitespace-pre-line">{maintenance.description || 'Không có mô tả'}</p>
            </Card>

            <Divider />

            <Card
                title={
                    <div className="flex items-center">
                        <CarOutlined className="mr-2 text-blue-500" />
                        <span>Thông tin phương tiện</span>
                    </div>
                }
                className="mb-6"
            >
                <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
                    <Descriptions.Item label="Biển số xe">
                        {maintenance.vehicleEntity?.licensePlateNumber || 'Không có dữ liệu xe'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mẫu xe">
                        {maintenance.vehicleEntity?.model || 'Không có dữ liệu xe'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhà sản xuất">
                        {maintenance.vehicleEntity?.manufacturer || 'Không có dữ liệu xe'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Năm sản xuất">
                        {maintenance.vehicleEntity?.year ?? 'Không có dữ liệu xe'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại xe">
                        {(maintenance?.vehicleEntity as any)?.vehicleTypeEntity?.vehicleTypeName || 
                         maintenance?.vehicleEntity?.vehicleTypeDescription || 
                         (maintenance?.vehicleEntity?.vehicleTypeId ? 'Đã có ID loại xe nhưng thiếu thông tin mô tả' : 'Không có dữ liệu loại xe')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {maintenance.vehicleEntity ? (
                            <VehicleStatusTag status={maintenance.vehicleEntity.status as VehicleStatusEnum} />
                        ) : (
                            'Không có dữ liệu xe'
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    );
};

export default VehicleMaintenanceDetail;