import React from 'react';
import { Card, Row, Col, Space, Tag, Typography } from 'antd';
import { 
    CarOutlined, 
    UserOutlined, 
    PhoneOutlined,
    ToolOutlined,
    CalendarOutlined 
} from '@ant-design/icons';
import type { VehicleAssignment } from '@/models/Issue';

const { Text } = Typography;

interface VehicleDriverInfoProps {
    vehicleAssignment?: VehicleAssignment;
}

const VehicleDriverInfo: React.FC<VehicleDriverInfoProps> = ({ vehicleAssignment }) => {
    if (!vehicleAssignment) {
        return (
            <Card className="shadow-md">
                <div className="text-center py-8 text-gray-500">
                    Không có thông tin phương tiện
                </div>
            </Card>
        );
    }

    const { vehicle, driver1, driver2, status, trackingCode } = vehicleAssignment;

    return (
        <Card 
            className="shadow-md"
            style={{ borderRadius: 8 }}
        >
            {/* Header with Vehicle License Plate */}
            <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                margin: '-24px -24px 24px -24px',
                padding: '20px 24px',
                borderRadius: '8px 8px 0 0'
            }}>
                <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                        <CarOutlined style={{ fontSize: 24, color: 'white' }} />
                        <Text strong style={{ fontSize: 20, color: 'white' }}>
                            {vehicle?.licensePlateNumber || 'N/A'}
                        </Text>
                    </Space>
                    <Tag color={status === 'ACTIVE' ? 'success' : 'default'} style={{ fontSize: 14 }}>
                        {status}
                    </Tag>
                </Space>
            </div>

            {/* Vehicle Info */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <div style={{ 
                        background: '#f8f9fa', 
                        padding: 16, 
                        borderRadius: 8,
                        border: '1px solid #e9ecef'
                    }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Space>
                                <ToolOutlined style={{ color: '#6c757d' }} />
                                <Text type="secondary">Nhà sản xuất:</Text>
                                <Text strong>{vehicle?.manufacturer || 'Không có thông tin'}</Text>
                            </Space>
                            <Space>
                                <CarOutlined style={{ color: '#6c757d' }} />
                                <Text type="secondary">Mẫu xe:</Text>
                                <Text strong>{vehicle?.model || 'Không có thông tin'}</Text>
                            </Space>
                            <Space>
                                <CarOutlined style={{ color: '#6c757d' }} />
                                <Text type="secondary">Loại xe:</Text>
                                <Tag color="blue">
                                    {vehicle?.vehicleType?.description || 'Không có thông tin'}
                                </Tag>
                            </Space>
                        </Space>
                    </div>
                </Col>

                <Col xs={24} md={12}>
                    <div style={{ 
                        background: '#f8f9fa', 
                        padding: 16, 
                        borderRadius: 8,
                        border: '1px solid #e9ecef'
                    }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Space>
                                <CalendarOutlined style={{ color: '#6c757d' }} />
                                <Text type="secondary">Năm sản xuất:</Text>
                                <Text strong>{vehicle?.year || 'Không có thông tin'}</Text>
                            </Space>
                            <Space>
                                <Text type="secondary">Mã chuyến:</Text>
                                <Tag color="purple">{trackingCode}</Tag>
                            </Space>
                        </Space>
                    </div>
                </Col>
            </Row>

            {/* Drivers Info */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {/* Driver 1 */}
                <Col xs={24} lg={12}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        padding: 16,
                        borderRadius: 8,
                        border: '2px solid #81c784'
                    }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between' 
                            }}>
                                <Space>
                                    <UserOutlined style={{ fontSize: 18, color: '#2e7d32' }} />
                                    <Text strong style={{ fontSize: 16, color: '#2e7d32' }}>
                                        Tài xế chính
                                    </Text>
                                </Space>
                            </div>

                            {driver1 ? (
                                <>
                                    <div>
                                        <UserOutlined style={{ marginRight: 8, color: '#2e7d32' }} />
                                        <Text strong style={{ fontSize: 15 }}>
                                            {driver1.fullName}
                                        </Text>
                                    </div>
                                    <div>
                                        <PhoneOutlined style={{ marginRight: 8, color: '#2e7d32' }} />
                                        <Text>{driver1.phoneNumber || 'Không có SĐT'}</Text>
                                    </div>
                                </>
                            ) : (
                                <Text type="secondary">Chưa có tài xế chính</Text>
                            )}
                        </Space>
                    </div>
                </Col>

                {/* Driver 2 */}
                <Col xs={24} lg={12}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        padding: 16,
                        borderRadius: 8,
                        border: '2px solid #64b5f6'
                    }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between' 
                            }}>
                                <Space>
                                    <UserOutlined style={{ fontSize: 18, color: '#1976d2' }} />
                                    <Text strong style={{ fontSize: 16, color: '#1976d2' }}>
                                        Tài xế phụ
                                    </Text>
                                </Space>
                            </div>

                            {driver2 ? (
                                <>
                                    <div>
                                        <UserOutlined style={{ marginRight: 8, color: '#1976d2' }} />
                                        <Text strong style={{ fontSize: 15 }}>
                                            {driver2.fullName}
                                        </Text>
                                    </div>
                                    <div>
                                        <PhoneOutlined style={{ marginRight: 8, color: '#1976d2' }} />
                                        <Text>{driver2.phoneNumber || 'Không có SĐT'}</Text>
                                    </div>
                                </>
                            ) : (
                                <Text type="secondary">Chưa có tài xế phụ</Text>
                            )}
                        </Space>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default VehicleDriverInfo;
