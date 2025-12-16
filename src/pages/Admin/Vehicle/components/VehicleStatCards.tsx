import React from 'react';
import { Row, Col, Card, Badge, Typography, Skeleton } from 'antd';
import { 
    CheckCircleOutlined, 
    StopOutlined, 
    ToolOutlined, 
    CarOutlined, 
    ExclamationCircleOutlined, 
    AlertOutlined,
    FileProtectOutlined,
    SafetyCertificateOutlined,
    ClockCircleOutlined
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
    const activeVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.ACTIVE);
    const inactiveVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.INACTIVE);
    const maintenanceVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.MAINTENANCE);
    const inTransitVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.IN_TRANSIT);
    const breakdownVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.BREAKDOWN);
    const accidentVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.ACCIDENT);
    // Thêm các trạng thái hết hạn và sắp đến hạn
    const inspectionExpiredVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.INSPECTION_EXPIRED);
    const insuranceExpiredVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.INSURANCE_EXPIRED);
    const inspectionDueVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.INSPECTION_DUE);
    const insuranceDueVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.INSURANCE_DUE);
    const maintenanceDueVehicles = vehicles.filter(vehicle => vehicle.status?.toUpperCase() === VehicleStatusEnum.MAINTENANCE_DUE);
    
    // Tổng hợp các xe có vấn đề (hết hạn hoặc sắp đến hạn)
    const expiredVehicles = [...inspectionExpiredVehicles, ...insuranceExpiredVehicles];
    const dueVehicles = [...inspectionDueVehicles, ...insuranceDueVehicles, ...maintenanceDueVehicles];

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
            {/* Card thống kê xe hết hạn */}
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Hết hạn</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-rose-700">{expiredVehicles.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : expiredVehicles.length} color="#e11d48" showZero>
                            <div className="bg-rose-200 p-2 rounded-full">
                                <FileProtectOutlined className="text-2xl text-rose-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            {/* Card thống kê xe sắp đến hạn */}
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Sắp đến hạn</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-amber-700">{dueVehicles.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : dueVehicles.length} color="#f59e0b" showZero>
                            <div className="bg-amber-200 p-2 rounded-full">
                                <ClockCircleOutlined className="text-2xl text-amber-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

export default VehicleStatCards;
