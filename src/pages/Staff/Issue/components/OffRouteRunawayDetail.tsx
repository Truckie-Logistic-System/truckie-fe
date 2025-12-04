import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Tag,
    Typography,
    Spin,
    Skeleton,
    Row,
    Col,
    Space,
    Divider,
    Alert,
    Statistic,
    App,
    Button,
    message
} from 'antd';
import {
    WarningOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    PhoneOutlined,
    UserOutlined,
    HomeOutlined,
    InboxOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    PlusOutlined
} from '@ant-design/icons';
import type { Issue } from '@/models/Issue';
import { OrderStatusLabels } from '@/constants/enums';
import issueService, { type OffRouteRunawayDetail as OffRouteRunawayDetailType, type PackageInfo } from '@/services/issue/issueService';
import type { OffRouteEvent } from '@/models/OffRouteEvent';
import RefundProcessingDetail from './RefundProcessingDetail';
import ContactConfirmationModal from './ContactConfirmationModal';
import GracePeriodExtensionModal from './GracePeriodExtensionModal';
import GracePeriodCountdown from './GracePeriodCountdown';

const { Title, Text } = Typography;

interface OffRouteRunawayDetailProps {
    issue: Issue;
    onUpdate: (updatedIssue: Issue) => void;
}

const OffRouteRunawayDetail: React.FC<OffRouteRunawayDetailProps> = ({ issue, onUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<OffRouteRunawayDetailType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [offRouteEvent, setOffRouteEvent] = useState<OffRouteEvent | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Mock staff ID - in real app, get from auth context
    const staffId = 'staff-123';

    useEffect(() => {
        loadDetail();
    }, [issue.id, refreshTrigger]);

    const loadDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await issueService.getOffRouteRunawayDetail(issue.id);
            setDetail(data);
            
            // Fetch off-route event details if available
            if (data.offRouteEventInfo?.eventId) {
                try {
                    const eventData = await issueService.getOffRouteEventById(data.offRouteEventInfo.eventId);
                    setOffRouteEvent(eventData);
                } catch (eventError) {
                    console.error('Error fetching off-route event:', eventError);
                    // Don't fail the whole load if event fetch fails
                }
            }
        } catch (err: any) {
            setError(err.message || 'Không thể tải chi tiết sự cố');
        } finally {
            setLoading(false);
        }
    };

    const handleContactConfirm = (response: any) => {
        // Response contains: success, message, eventId, status, gracePeriodExpiresAt
        message.success(response.message || 'Đã xác nhận liên hệ với tài xế!');
        setRefreshTrigger(prev => prev + 1); // Refresh data to get updated event
    };

    const handleGracePeriodExtend = (response: any) => {
        // Response contains: success, message, eventId, status, gracePeriodExpiresAt
        message.success(response.message || 'Đã gia hạn thời gian chờ!');
        setRefreshTrigger(prev => prev + 1); // Refresh data to get updated event
    };

    const handleGracePeriodExpired = () => {
        message.warning('Thời gian chờ đã hết hạn!');
        setRefreshTrigger(prev => prev + 1); // Refresh data to get updated status
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const getWarningStatusColor = (status: string) => {
        switch (status) {
            case 'NONE':
                return 'default';
            case 'YELLOW_SENT':
                return 'gold';
            case 'RED_SENT':
                return 'red';
            case 'CONTACTED_WAITING_RETURN':
                return 'processing';
            case 'CONTACT_FAILED':
                return 'error';
            case 'ISSUE_CREATED':
                return 'volcano';
            case 'RESOLVED_SAFE':
                return 'success';
            case 'BACK_ON_ROUTE':
                return 'green';
            default:
                return 'default';
        }
    };

    const getWarningStatusLabel = (status: string) => {
        switch (status) {
            case 'NONE':
                return 'Chưa gửi cảnh báo';
            case 'YELLOW_SENT':
                return 'Cảnh báo vàng đã gửi';
            case 'RED_SENT':
                return 'Cảnh báo đỏ đã gửi';
            case 'CONTACTED_WAITING_RETURN':
                return 'Đã liên hệ - Chờ về tuyến';
            case 'CONTACT_FAILED':
                return 'Liên hệ thất bại';
            case 'ISSUE_CREATED':
                return 'Đã tạo sự cố';
            case 'RESOLVED_SAFE':
                return 'Đã xác nhận an toàn';
            case 'BACK_ON_ROUTE':
                return 'Đã về tuyến';
            default:
                return status;
        }
    };

    const packageColumns = [
        {
            title: 'Mã tracking',
            dataIndex: 'trackingCode',
            key: 'trackingCode',
            render: (text: string) => <Text strong copyable>{text}</Text>
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Khối lượng',
            key: 'weight',
            render: (_: any, record: PackageInfo) => (
                <span>{record.weightBaseUnit} {record.unit}</span>
            )
        },
        {
            title: 'Giá trị khai báo',
            dataIndex: 'declaredValue',
            key: 'declaredValue',
            align: 'right' as const,
            render: (value: number) => (
                <Text strong style={{ color: '#1890ff' }}>
                    {formatCurrency(value || 0)}
                </Text>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'DELIVERED' ? 'green' : status === 'IN_TRANSIT' ? 'blue' : 'orange'}>
                    {OrderStatusLabels[status as keyof typeof OrderStatusLabels] || status}
                </Tag>
            )
        }
    ];

    if (loading) {
        return (
            <Card>
                <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
        );
    }

    if (error) {
        return (
            <Alert
                message="Lỗi"
                description={error}
                type="error"
                showIcon
            />
        );
    }

    if (!detail) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Off-Route Event Info */}
            <Card 
                title={
                    <Space>
                        <WarningOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Thông tin sự kiện lệch tuyến</span>
                    </Space>
                }
                bordered={false}
                style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderTop: '3px solid #ff4d4f'
                }}
            >
                {detail.offRouteEventInfo ? (
                    <div className="space-y-4">
                        {/* Alert Banner */}
                        <Alert
                            message="Sự cố lệch tuyến nghiêm trọng"
                            description={`Tài xế đã lệch khỏi tuyến đường đã lên kế hoạch trong ${detail.offRouteEventInfo.offRouteDurationMinutes} phút với khoảng cách ${Math.round(detail.offRouteEventInfo.distanceFromRouteMeters)} mét.`}
                            type="error"
                            showIcon
                            icon={<WarningOutlined />}
                        />
                        
                        {/* Main Stats */}
                        <Row gutter={[24, 16]}>
                            <Col span={6}>
                                <Statistic
                                    title="Thời gian lệch tuyến"
                                    value={detail.offRouteEventInfo.offRouteDurationMinutes}
                                    suffix="phút"
                                    prefix={<ClockCircleOutlined />}
                                    valueStyle={{ color: '#cf1322', fontSize: 28 }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Khoảng cách lệch"
                                    value={Math.round(detail.offRouteEventInfo.distanceFromRouteMeters)}
                                    suffix="mét"
                                    prefix={<EnvironmentOutlined />}
                                    valueStyle={{ color: '#cf1322', fontSize: 28 }}
                                />
                            </Col>
                            <Col span={6}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái cảnh báo</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Tag 
                                            color={getWarningStatusColor(detail.offRouteEventInfo.warningStatus)}
                                            style={{ fontSize: 14, padding: '6px 16px', fontWeight: 600 }}
                                        >
                                            {getWarningStatusLabel(detail.offRouteEventInfo.warningStatus)}
                                        </Tag>
                                    </div>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Liên hệ được tài xế</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Tag 
                                            color={detail.offRouteEventInfo.canContactDriver ? 'success' : 'error'}
                                            style={{ fontSize: 14, padding: '6px 16px' }}
                                        >
                                            {detail.offRouteEventInfo.canContactDriver ? '✓ Có thể liên hệ' : '✗ Không liên hệ được'}
                                        </Tag>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        
                        <Divider style={{ margin: '16px 0' }} />
                        
                        {/* Timeline Info (simplified - only thời điểm phát hiện + liên hệ gần nhất) */}
                        <Row gutter={[24, 16]}>
                            <Col span={12}>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <Text type="secondary" style={{ fontSize: 12 }}>Thời điểm phát hiện lệch tuyến</Text>
                                    <div><Text strong style={{ fontSize: 14 }}>{formatDateTime(detail.offRouteEventInfo.detectedAt)}</Text></div>
                                </div>
                            </Col>
                            {detail.offRouteEventInfo.contactedAt && (
                                <Col span={12}>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <Text type="secondary" style={{ fontSize: 12 }}>Thời điểm liên hệ gần nhất</Text>
                                        <div><Text strong style={{ fontSize: 14, color: '#1890ff' }}>{formatDateTime(detail.offRouteEventInfo.contactedAt)}</Text></div>
                                    </div>
                                </Col>
                            )}
                        </Row>
                        
                        {/* Contact Notes */}
                        {detail.offRouteEventInfo.contactNotes && (
                            <>
                                <Divider style={{ margin: '16px 0' }} />
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <Text type="secondary" style={{ fontSize: 12 }}>Ghi chú liên hệ</Text>
                                    <div><Text style={{ fontSize: 14 }}>{detail.offRouteEventInfo.contactNotes}</Text></div>
                                </div>
                            </>
                        )}
                        
                        {/* Action Buttons - Simplified */}
                        <Divider style={{ margin: '16px 0' }} />
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            {/* Grace Period Countdown - only show if applicable */}
                            {offRouteEvent && offRouteEvent.warningStatus === 'CONTACTED_WAITING_RETURN' && (
                                <GracePeriodCountdown
                                    offRouteEvent={offRouteEvent}
                                    onExpired={handleGracePeriodExpired}
                                />
                            )}
                            
                            {/* Action Buttons - Simplified flow */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {(offRouteEvent?.warningStatus === 'YELLOW_SENT' || offRouteEvent?.warningStatus === 'RED_SENT') && (
                                    <Button
                                        type="primary"
                                        icon={<PhoneOutlined />}
                                        onClick={() => setShowContactModal(true)}
                                        style={{ 
                                            background: offRouteEvent?.warningStatus === 'RED_SENT' ? '#ff4d4f' : '#1890ff', 
                                            borderColor: offRouteEvent?.warningStatus === 'RED_SENT' ? '#ff4d4f' : '#1890ff' 
                                        }}
                                    >
                                        Xác nhận đã liên hệ tài xế
                                    </Button>
                                )}
                            </div>
                        </Space>
                    </div>
                ) : (
                    <Text type="secondary">Không có thông tin sự kiện lệch tuyến</Text>
                )}
            </Card>

            
            {/* Packages Table */}
            <Card
                title={
                    <Space>
                        <InboxOutlined style={{ color: '#722ed1', fontSize: 18 }} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Chi tiết các kiện hàng trong chuyến xe</span>
                    </Space>
                }
                bordered={false}
                style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderTop: '3px solid #722ed1'
                }}
                extra={
                    <div style={{
                        background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                        padding: '8px 16px',
                        borderRadius: '6px'
                    }}>
                        <Text strong style={{ color: 'white', fontSize: 14 }}>
                            Tổng giá trị: {formatCurrency(detail.totalDeclaredValue || 0)}
                        </Text>
                    </div>
                }
            >
                <Table
                    columns={packageColumns}
                    dataSource={detail.packages}
                    rowKey="orderDetailId"
                    pagination={false}
                    size="middle"
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <Text strong>Tổng cộng ({detail.packages.length} kiện)</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    <Text strong style={{ color: '#722ed1', fontSize: 16 }}>
                                        {formatCurrency(detail.totalDeclaredValue || 0)}
                                    </Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </Card>

            {/* Refund Processing Section - Reuse from DAMAGE flow */}
            {detail.packages.length > 0 && (
                <Card
                    title={
                        <Space>
                            <DollarOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                            <span style={{ fontSize: 16, fontWeight: 600 }}>Xử lý đền bù</span>
                        </Space>
                    }
                    bordered={false}
                    style={{ 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        borderTop: '3px solid #52c41a'
                    }}
                >
                    <RefundProcessingDetail
                        issue={{
                            ...issue,
                            sender: detail.sender ? {
                                id: detail.sender.id,
                                companyName: detail.sender.companyName,
                                representativeName: detail.sender.representativeName,
                                representativePhone: detail.sender.representativePhone,
                                businessAddress: detail.sender.businessAddress
                            } : undefined
                        }}
                        orderDetailId={detail.packages[0]?.orderDetailId || ''}
                        onUpdate={onUpdate}
                    />
                </Card>
            )}
            
            {/* Modals */}
            <ContactConfirmationModal
                visible={showContactModal}
                onCancel={() => setShowContactModal(false)}
                onConfirm={handleContactConfirm}
                offRouteEvent={offRouteEvent}
                staffId={staffId}
            />
            
            <GracePeriodExtensionModal
                visible={showExtensionModal}
                onCancel={() => setShowExtensionModal(false)}
                onExtend={handleGracePeriodExtend}
                offRouteEvent={offRouteEvent}
                staffId={staffId}
            />
        </div>
    );
};

export default OffRouteRunawayDetail;
