import React from 'react';
import { Row, Col, Card, Badge, Typography, Skeleton } from 'antd';
import { 
    CheckCircleOutlined, 
    StopOutlined, 
    ToolOutlined, 
    ExclamationCircleOutlined 
} from '@ant-design/icons';
import { DeviceStatusEnum } from '@/constants/enums';

const { Title, Text } = Typography;

interface DeviceStatCardsProps {
    devices: any[];
    loading: boolean;
    type: 'devices' | 'deviceTypes';
}

const DeviceStatCards: React.FC<DeviceStatCardsProps> = ({ devices, loading, type }) => {
    // Lọc thiết bị theo từng trạng thái trong DeviceStatusEnum
    const activeDevices = devices.filter(device => device.status?.toLowerCase() === DeviceStatusEnum.ACTIVE.toLowerCase());
    const inactiveDevices = devices.filter(device => device.status?.toLowerCase() === DeviceStatusEnum.INACTIVE.toLowerCase());
    const maintenanceDevices = devices.filter(device => device.status?.toLowerCase() === DeviceStatusEnum.MAINTENANCE.toLowerCase());
    const brokenDevices = devices.filter(device => device.status?.toLowerCase() === DeviceStatusEnum.BROKEN.toLowerCase());

    const entityName = type === 'devices' ? 'thiết bị' : 'loại thiết bị';

    return (
        <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Hoạt động</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-green-700">{activeDevices.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : activeDevices.length} color="green" showZero>
                            <div className="bg-green-200 p-2 rounded-full">
                                <CheckCircleOutlined className="text-2xl text-green-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Không hoạt động</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-gray-700">{inactiveDevices.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : inactiveDevices.length} color="#6B7280" showZero>
                            <div className="bg-gray-200 p-2 rounded-full">
                                <StopOutlined className="text-2xl text-gray-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Đang bảo trì</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-blue-700">{maintenanceDevices.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : maintenanceDevices.length} color="blue" showZero>
                            <div className="bg-blue-200 p-2 rounded-full">
                                <ToolOutlined className="text-2xl text-blue-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Hỏng</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-red-700">{brokenDevices.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : brokenDevices.length} color="red" showZero>
                            <div className="bg-red-200 p-2 rounded-full">
                                <ExclamationCircleOutlined className="text-2xl text-red-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

export default DeviceStatCards;
