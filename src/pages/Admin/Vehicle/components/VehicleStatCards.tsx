import React from 'react';
import { Row, Col, Card, Badge, Typography, Skeleton } from 'antd';
import { 
    CheckCircleOutlined, 
    StopOutlined, 
    ToolOutlined, 
    CarOutlined, 
    ExclamationCircleOutlined, 
    AlertOutlined 
} from '@ant-design/icons';
import { VehicleStatusEnum } from '@/constants/enums';
import type { Vehicle } from '@/models';

const { Title, Text } = Typography;

interface VehicleStatCardsProps {
    vehicles: Vehicle[];
    loading: boolean;
}

const VehicleStatCards: React.FC<VehicleStatCardsProps> = ({ vehicles, loading }) => {
    // Lọc xe theo từng trạng thái trong VehicleStatusEnum
    const activeVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === VehicleStatusEnum.ACTIVE.toLowerCase());
    const inactiveVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === VehicleStatusEnum.INACTIVE.toLowerCase());
    const maintenanceVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === VehicleStatusEnum.MAINTENANCE.toLowerCase());
    const inTransitVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === VehicleStatusEnum.IN_TRANSIT.toLowerCase());
    const breakdownVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === VehicleStatusEnum.BREAKDOWN.toLowerCase());
    const accidentVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === VehicleStatusEnum.ACCIDENT.toLowerCase());

    return (
        <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Hoạt động</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-green-700">{activeVehicles.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : activeVehicles.length} color="green" showZero>
                            <div className="bg-green-200 p-2 rounded-full">
                                <CheckCircleOutlined className="text-2xl text-green-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Không hoạt động</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-gray-700">{inactiveVehicles.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : inactiveVehicles.length} color="#6B7280" showZero>
                            <div className="bg-gray-200 p-2 rounded-full">
                                <StopOutlined className="text-2xl text-gray-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Bảo trì</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-blue-700">{maintenanceVehicles.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : maintenanceVehicles.length} color="blue" showZero>
                            <div className="bg-blue-200 p-2 rounded-full">
                                <ToolOutlined className="text-2xl text-blue-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Đang di chuyển</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-yellow-700">{inTransitVehicles.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : inTransitVehicles.length} color="#eab308" showZero>
                            <div className="bg-yellow-200 p-2 rounded-full">
                                <CarOutlined className="text-2xl text-yellow-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Hỏng hóc</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-orange-700">{breakdownVehicles.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : breakdownVehicles.length} color="orange" showZero>
                            <div className="bg-orange-200 p-2 rounded-full">
                                <ExclamationCircleOutlined className="text-2xl text-orange-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Tai nạn</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-red-700">{accidentVehicles.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : accidentVehicles.length} color="red" showZero>
                            <div className="bg-red-200 p-2 rounded-full">
                                <AlertOutlined className="text-2xl text-red-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

export default VehicleStatCards;
