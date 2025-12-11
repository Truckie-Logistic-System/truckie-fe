import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    Button,
    Space,
    Typography,
    message,
    Row,
    Col,
    Tag,
    Divider,
    Alert,
    Statistic
} from 'antd';
import {
    ClockCircleOutlined,
    PlusOutlined,
    WarningOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import issueService from '@/services/issue/issueService';
import type { OffRouteEvent } from '@/models/OffRouteEvent';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface GracePeriodExtensionModalProps {
    visible: boolean;
    onCancel: () => void;
    onExtend: (response: any) => void;
    offRouteEvent: OffRouteEvent | null;
    staffId: string;
}

const GracePeriodExtensionModal: React.FC<GracePeriodExtensionModalProps> = ({
    visible,
    onCancel,
    onExtend,
    offRouteEvent,
    staffId
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [extensionReason, setExtensionReason] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);

    // Check if form is valid whenever extension reason changes
    useEffect(() => {
        setIsFormValid(extensionReason.trim().length > 0);
    }, [extensionReason]);

    const handleSubmit = async () => {
        if (!offRouteEvent) return;

        try {
            setLoading(true);
            const response = await issueService.extendGracePeriod(
                offRouteEvent.id,
                staffId,
                extensionReason.trim() || undefined
            );
            
            if (response.success) {
                message.success(response.message || 'Đã gia hạn thời gian chờ thành công!');
                onExtend(response);
                handleCancel();
            } else {
                message.error('Không thể gia hạn thời gian chờ');
            }
        } catch (error: any) {
            console.error('Error extending grace period:', error);
            message.error(error.message || 'Không thể gia hạn thời gian chờ');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setExtensionReason('');
        onCancel();
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const calculateTimeRemaining = (expiresAt: string): string => {
        if (!expiresAt) return 'Không có thông tin';
        
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffMs = expiry.getTime() - now.getTime();
        
        if (diffMs <= 0) return 'Đã hết hạn';
        
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
            return `${diffHours} giờ ${diffMinutes} phút`;
        } else {
            return `${diffMinutes} phút`;
        }
    };

    if (!offRouteEvent) return null;

    const timeRemaining = calculateTimeRemaining(offRouteEvent.gracePeriodExpiresAt || '');
    const isExpired = timeRemaining === 'Đã hết hạn';

    return (
        <Modal
            title={
                <Space>
                    <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                    <span>Gia hạn thời gian chờ</span>
                </Space>
            }
            open={visible}
            onCancel={handleCancel}
            width={600}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Hủy
                </Button>,
                <Button
                    key="extend"
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                    icon={<PlusOutlined />}
                    disabled={isExpired || !isFormValid}
                >
                    Gia hạn thời gian chờ
                </Button>
            ]}
        >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Current Grace Period Status */}
                <div>
                    <Title level={5}>Trạng thái thời gian chờ hiện tại</Title>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Statistic
                                title="Thời gian còn lại"
                                value={timeRemaining}
                                valueStyle={{ 
                                    color: isExpired ? '#cf1322' : '#fa8c16',
                                    fontSize: '18px'
                                }}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Col>
                        <Col span={12}>
                            <Statistic
                                title="Số lần gia hạn"
                                value={offRouteEvent.gracePeriodExtensionCount}
                                valueStyle={{ color: '#1890ff' }}
                                prefix={<PlusOutlined />}
                            />
                        </Col>
                        <Col span={24}>
                            <Space>
                                <Text type="secondary">Hết hạn lúc:</Text>
                                <Text strong>
                                    {offRouteEvent.gracePeriodExpiresAt 
                                        ? formatDateTime(offRouteEvent.gracePeriodExpiresAt)
                                        : 'Không có thông tin'
                                    }
                                </Text>
                            </Space>
                        </Col>
                    </Row>
                </div>

                <Divider />

                {/* Extension Reason */}
                <div>
                    <Title level={5}>Lý do gia hạn</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        Vui lòng nhập lý do cần gia hạn thời gian chờ cho tài xế
                    </Text>
                    <TextArea
                        rows={4}
                        placeholder="Ví dụ: Tài xế báo kẹt xe do tai nạn, cần thêm 30 phút để về tuyến..."
                        value={extensionReason}
                        onChange={(e) => setExtensionReason(e.target.value)}
                        maxLength={500}
                        showCount
                    />
                </div>

                {/* Warning Messages */}
                {isExpired && (
                    <Alert
                        message="Thời gian chờ đã hết hạn"
                        description="Không thể gia hạn vì thời gian chờ đã hết. Vui lòng tạo sự cố để xử lý."
                        type="error"
                        showIcon
                        icon={<WarningOutlined />}
                    />
                )}

                {offRouteEvent.gracePeriodExtensionCount >= 3 && !isExpired && (
                    <Alert
                        message="Đã gia hạn nhiều lần"
                        description="Sự kiện này đã được gia hạn 3 lần. Hãy cân nhắc tạo sự cố nếu tài xế tiếp tục không về tuyến."
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                    />
                )}

                {!isExpired && offRouteEvent.gracePeriodExtensionCount < 3 && (
                    <div style={{
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: '6px',
                        padding: '12px'
                    }}>
                        <Space>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <Text style={{ color: '#52c41a' }}>
                                Sau khi gia hạn, tài xế sẽ có thêm thời gian để về tuyến.
                                Hệ thống sẽ tiếp tục theo dõi vị trí của tài xế.
                            </Text>
                        </Space>
                    </div>
                )}
            </Space>
        </Modal>
    );
};

export default GracePeriodExtensionModal;
