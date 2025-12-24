import React, { useState } from 'react';
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
    Divider
} from 'antd';
import {
    PhoneOutlined,
    UserOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import issueService from '@/services/issue/issueService';
import type { OffRouteEvent } from '@/models/OffRouteEvent';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface ContactConfirmationModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (response: any) => void;
    offRouteEvent: OffRouteEvent | null;
    staffId: string;
}

const ContactConfirmationModal: React.FC<ContactConfirmationModalProps> = ({
    visible,
    onCancel,
    onConfirm,
    offRouteEvent,
    staffId
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [contactNotes, setContactNotes] = useState('');

    const handleSubmit = async () => {
        if (!offRouteEvent) return;

        try {
            setLoading(true);
            const response = await issueService.confirmContact(
                offRouteEvent.id,
                staffId,
                contactNotes.trim() || undefined
            );
            
            if (response.success) {
                message.success(response.message || 'Đã xác nhận liên hệ với tài xế thành công!');
                onConfirm(response);
                handleCancel();
            } else {
                message.error('Không thể xác nhận liên hệ với tài xế');
            }
        } catch (error: any) {
            console.error('Error confirming contact:', error);
            message.error(error.message || 'Không thể xác nhận liên hệ với tài xế');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setContactNotes('');
        onCancel();
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const getWarningStatusColor = (status: string) => {
        switch (status) {
            case 'YELLOW_SENT':
                return 'gold';
            case 'RED_SENT':
                return 'red';
            default:
                return 'default';
        }
    };

    const getWarningStatusLabel = (status: string) => {
        switch (status) {
            case 'YELLOW_SENT':
                return 'Cảnh báo vàng';
            case 'RED_SENT':
                return 'Cảnh báo đỏ';
            default:
                return status;
        }
    };

    if (!offRouteEvent) return null;

    return (
        <Modal
            title={
                <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span>Xác nhận liên hệ với tài xế</span>
                </Space>
            }
            open={visible}
            onCancel={handleCancel}
            width={700}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Hủy
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                    icon={<CheckCircleOutlined />}
                >
                    Xác nhận đã liên hệ
                </Button>
            ]}
        >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Event Information */}
                <div>
                    <Title level={5}>Thông tin sự kiện lệch tuyến</Title>
                    <Row gutter={[16, 8]}>
                        <Col span={12}>
                            <Space>
                                <EnvironmentOutlined style={{ color: '#ff4d4f' }} />
                                <Text type="secondary">Khoảng cách lệch:</Text>
                                <Text strong style={{ color: '#ff4d4f' }}>
                                    {Math.round(offRouteEvent.distanceFromRouteMeters)}m
                                </Text>
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Space>
                                <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                                <Text type="secondary">Thời gian lệch:</Text>
                                <Text strong>{offRouteEvent.offRouteDurationSeconds} giây</Text>
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Space>
                                <Text type="secondary">Trạng thái:</Text>
                                <Tag color={getWarningStatusColor(offRouteEvent.warningStatus)}>
                                    {getWarningStatusLabel(offRouteEvent.warningStatus)}
                                </Tag>
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Space>
                                <Text type="secondary">Phát hiện lúc:</Text>
                                <Text>{formatDateTime(offRouteEvent.offRouteStartTime)}</Text>
                            </Space>
                        </Col>
                    </Row>
                </div>

                <Divider />

                {/* Contact Information */}
                <div>
                    <Title level={5}>Thông tin liên hệ</Title>
                    <Row gutter={[16, 8]}>
                        <Col span={12}>
                            <Space>
                                <UserOutlined style={{ color: '#1890ff' }} />
                                <Text type="secondary">Tài xế 1:</Text>
                                <Text strong>
                                    {offRouteEvent.vehicleAssignment?.driver1?.fullName || 'Không có thông tin'}
                                </Text>
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Space>
                                <PhoneOutlined style={{ color: '#52c41a' }} />
                                <Text type="secondary">Số điện thoại:</Text>
                                <Text strong copyable style={{ color: '#1890ff' }}>
                                    {offRouteEvent.vehicleAssignment?.driver1?.phoneNumber || 'Không có thông tin'}
                                </Text>
                            </Space>
                        </Col>
                    </Row>
                </div>

                <Divider />

                {/* Contact Notes */}
                <div>
                    <Title level={5}>Ghi chú liên hệ</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        Nhập ghi chú về cuộc liên hệ với tài xế (không bắt buộc)
                    </Text>
                    <TextArea
                        rows={4}
                        placeholder="Ví dụ: Đã liên hệ với tài xế, tài xế báo sẽ về tuyến trong 15 phút..."
                        value={contactNotes}
                        onChange={(e) => setContactNotes(e.target.value)}
                        maxLength={500}
                        showCount
                    />
                </div>

                {/* Confirmation Message */}
                <div style={{
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px',
                    padding: '12px'
                }}>
                    <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text style={{ color: '#52c41a' }}>
                            Sau khi xác nhận, hệ thống sẽ chờ tài xế về tuyến trong thời gian quy định.
                            Nếu tài xế không về tuyến, bạn có thể gia hạn thời gian chờ hoặc tạo sự cố.
                        </Text>
                    </Space>
                </div>
            </Space>
        </Modal>
    );
};

export default ContactConfirmationModal;
