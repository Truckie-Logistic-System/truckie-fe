import React, { useState, useEffect } from 'react';
import { Card, Image, Button, Select, message, Space, Tag, Alert, Typography, Row, Col, Divider, App } from 'antd';
import { 
    CheckCircleOutlined, 
    SwapOutlined, 
    LockOutlined, 
    UnlockOutlined,
    ReloadOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CameraOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import type { Issue, Seal } from '../../../../models/Issue';
import issueService from '../../../../services/issue/issueService';
import { useAuth } from '../../../../context/AuthContext';
import { getSealStatusLabel, getSealStatusColor } from '../../../../constants/sealConstants';

const { Text } = Typography;

interface SealReplacementDetailProps {
    issue: Issue;
    onUpdate: (updatedIssue: Issue) => void;
}

const SealReplacementDetail: React.FC<SealReplacementDetailProps> = ({ issue, onUpdate }) => {
    const { user } = useAuth();
    const { modal } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [activeSeals, setActiveSeals] = useState<Seal[]>([]);
    const [selectedSealId, setSelectedSealId] = useState<string | null>(null);
    const [loadingSeals, setLoadingSeals] = useState(false);

    // Debug log
    // Auto-fetch active seals when component mounts or issue changes
    useEffect(() => {
        if (issue.status === 'OPEN' && issue.vehicleAssignment?.id) {
            fetchActiveSeals();
        }
    }, [issue.id, issue.status]);

    // Fetch active seals for selection
    const fetchActiveSeals = async () => {
        if (!issue.vehicleAssignment?.id) {
            return;
        }
        setLoadingSeals(true);
        try {
            const seals = await issueService.getActiveSeals(issue.vehicleAssignment.id);
            
            setActiveSeals(seals);
        } catch (error: any) {
            console.error('[SealReplacementDetail] Error fetching seals:', error);
            message.error(error.message || 'Không thể tải danh sách seal');
        } finally {
            setLoadingSeals(false);
        }
    };

    // Handle assign new seal (Staff only)
    const handleAssignNewSeal = () => {
        if (!selectedSealId || !user) {
            message.error('Vui lòng chọn seal và đảm bảo bạn đã đăng nhập!');
            return;
        }

        const selectedSeal = activeSeals.find(s => s.id === selectedSealId);
        // Validate selected seal status
        if (!selectedSeal) {
            console.error('[SealReplacementDetail] ❌ Selected seal not found in activeSeals list');
            message.error('Seal được chọn không hợp lệ. Vui lòng chọn lại seal.');
            return;
        }
        
        if (selectedSeal.status !== 'ACTIVE') {
            console.error('[SealReplacementDetail] ❌ Selected seal status is not ACTIVE:', selectedSeal.status);
            message.error(`Seal được chọn có trạng thái ${selectedSeal.status}, không phải ACTIVE. Vui lòng chọn seal có trạng thái ACTIVE.`);
            return;
        }
        
        // Try using modal.confirm from App.useApp()
        try {
            modal.confirm({
                title: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <SwapOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        <span style={{ fontSize: 18, fontWeight: 600 }}>Xác nhận gán seal mới</span>
                    </div>
                ),
                content: (
                    <div style={{ padding: '16px 0' }}>
                        <p style={{ fontSize: 16, marginBottom: 16, color: '#262626' }}>
                            Bạn có chắc muốn gán seal mới cho sự cố này?
                        </p>
                        <div style={{ 
                            background: '#f6f8fa', 
                            padding: 12, 
                            borderRadius: 8,
                            border: '1px solid #e8e8e8'
                        }}>
                            <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 4 }}>
                                Seal sẽ được gán:
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 500, color: '#1890ff' }}>
                                {selectedSeal?.sealCode || 'N/A'}
                            </div>
                        </div>
                    </div>
                ),
                okText: 'Xác nhận',
                cancelText: 'Hủy',
                okButtonProps: {
                    type: 'primary',
                    size: 'large',
                    style: {
                        borderRadius: 6,
                        height: 40,
                        fontWeight: 500
                    }
                },
                cancelButtonProps: {
                    size: 'large',
                    style: {
                        borderRadius: 6,
                        height: 40,
                        fontWeight: 500
                    }
                },
                centered: true,
                width: 480,
                maskClosable: false,
                onOk: async () => {
                    setLoading(true);
                    try {
                        const updated = await issueService.assignNewSeal(issue.id, selectedSealId, user.id);
                        onUpdate(updated);
                        message.success('Đã gán seal mới thành công! Tài xế sẽ nhận được thông báo.');
                    } catch (error: any) {
                        console.error('[SealReplacementDetail] ❌ API call failed:', error);
                        console.error('[SealReplacementDetail] Error details:', {
                            message: error.message,
                            status: error.response?.status,
                            data: error.response?.data
                        });
                        message.error(error.message || 'Không thể gán seal mới');
                    } finally {
                        setLoading(false);
                    }
                },
                onCancel: () => {
                }
            });
        } catch (error) {
            console.error('[SealReplacementDetail] ❌ modal.confirm error:', error);
            // Re-validate before fallback
            const fallbackSeal = activeSeals.find(s => s.id === selectedSealId);
            if (!fallbackSeal || fallbackSeal.status !== 'ACTIVE') {
                console.error('[SealReplacementDetail] ❌ Fallback validation failed - seal not ACTIVE');
                message.error('Seal được chọn không hợp lệ hoặc không có trạng thái ACTIVE.');
                return;
            }
            
            // Final fallback - use browser confirm
            const confirmMessage = `Bạn có chắc muốn gán seal mới cho sự cố này?\n\nSeal sẽ được gán: ${fallbackSeal.sealCode}\nMã sự cố: ${issue.id}`;
            if (window.confirm(confirmMessage)) {
                (async () => {
                    setLoading(true);
                    try {
                        const updated = await issueService.assignNewSeal(issue.id, selectedSealId, user.id);
                        onUpdate(updated);
                        message.success('Đã gán seal mới thành công! Tài xế sẽ nhận được thông báo.');
                    } catch (error: any) {
                        console.error('[SealReplacementDetail] ❌ API call failed:', error);
                        message.error(error.message || 'Không thể gán seal mới');
                    } finally {
                        setLoading(false);
                    }
                })();
            } else {
                message.info('Đã hủy gán seal mới');
            }
        }
    };

    // Render based on issue status
    const renderContent = () => {
        // OPEN status - Staff needs to assign new seal
        if (issue.status === 'OPEN') {
            return (
                <div className="seal-replacement-container">
                    <Alert
                        message={
                            <Space>
                                <UnlockOutlined />
                                <Text strong>Cần gán seal mới</Text>
                            </Space>
                        }
                        description="Seal đã bị gỡ. Vui lòng chọn seal ACTIVE khác để thay thế."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Card 
                                title={
                                    <Space>
                                        <LockOutlined style={{ color: '#ff4d4f' }} />
                                        <span>Seal bị gỡ</span>
                                    </Space>
                                }
                                bordered={false}
                                style={{ 
                                    height: '100%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderTop: '3px solid #ff4d4f'
                                }}
                            >
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div>
                                        <Text type="secondary">Mã seal:</Text>
                                        <br />
                                        <Tag color="red" style={{ fontSize: 16, padding: '4px 12px', marginTop: 4 }}>
                                            <SafetyOutlined /> {issue.oldSeal?.sealCode || 'N/A'}
                                        </Tag>
                                    </div>

                                    <div>
                                        <Text type="secondary">Trạng thái:</Text>
                                        <br />
                                        <Tag color={getSealStatusColor(issue.oldSeal?.status || 'REMOVED')} style={{ marginTop: 4 }}>
                                            {getSealStatusLabel(issue.oldSeal?.status || 'REMOVED')}
                                        </Tag>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    <div>
                                        <Space>
                                            <CameraOutlined />
                                            <Text strong>Ảnh seal bị gỡ:</Text>
                                        </Space>
                                        <div style={{ marginTop: 8 }}>
                                            {issue.sealRemovalImage ? (
                                                <Image
                                                    src={issue.sealRemovalImage}
                                                    alt="Seal bị gỡ"
                                                    width="100%"
                                                    style={{ 
                                                        borderRadius: 8,
                                                        border: '2px solid #f0f0f0'
                                                    }}
                                                    preview={{
                                                        mask: <div>Xem ảnh</div>
                                                    }}
                                                />
                                            ) : (
                                                <div style={{ 
                                                    padding: 40, 
                                                    textAlign: 'center', 
                                                    background: '#fafafa',
                                                    borderRadius: 8,
                                                    border: '1px dashed #d9d9d9'
                                                }}>
                                                    <CameraOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                                                    <br />
                                                    <Text type="secondary">Không có ảnh</Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card 
                                title={
                                    <Space>
                                        <SwapOutlined style={{ color: '#1890ff' }} />
                                        <span>Gán seal mới</span>
                                    </Space>
                                }
                                bordered={false}
                                style={{ 
                                    height: '100%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderTop: '3px solid #1890ff'
                                }}
                            >
                                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                        <Alert
                                            message="Hướng dẫn"
                                            description="1. Chọn seal mới từ danh sách
2. Xác nhận gán seal cho chuyến xe"
                                            type="info"
                                            showIcon
                                        />

                                        {loadingSeals ? (
                                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                                <ReloadOutlined spin style={{ fontSize: 24, color: '#1890ff' }} />
                                                <div style={{ marginTop: 8 }}>Đang tải danh sách seal...</div>
                                            </div>
                                        ) : activeSeals.filter(seal => seal.status === 'ACTIVE').length > 0 ? (
                                            <>
                                                <div>
                                                    <Text strong style={{ marginBottom: 8, display: 'block' }}>
                                                        Chọn seal mới ({activeSeals.filter(seal => seal.status === 'ACTIVE').length} seal khả dụng):
                                                    </Text>
                                                    <Select
                                                        placeholder="Chọn seal mới để thay thế"
                                                        style={{ width: '100%' }}
                                                        size="large"
                                                        onChange={(value) => setSelectedSealId(value)}
                                                        value={selectedSealId}
                                                        showSearch
                                                        optionFilterProp="children"
                                                    >
                                                        {activeSeals.filter(seal => seal.status === 'ACTIVE').map((seal) => (
                                                            <Select.Option key={seal.id} value={seal.id}>
                                                                <Space>
                                                                    <SafetyOutlined style={{ color: '#52c41a' }} />
                                                                    <Text strong>{seal.sealCode}</Text>
                                                                    <Tag color={getSealStatusColor(seal.status)}>{getSealStatusLabel(seal.status)}</Tag>
                                                                </Space>
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </div>

                                                <Button
                                                    type="primary"
                                                    icon={<SwapOutlined />}
                                                    onClick={() => {
                                                        handleAssignNewSeal();
                                                    }}
                                                    loading={loading}
                                                    disabled={!selectedSealId}
                                                    size="large"
                                                    block
                                                    style={{ 
                                                        height: 48,
                                                        fontSize: 16,
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Xác nhận gán seal mới
                                                </Button>
                                            </>
                                        ) : (
                                            <Alert
                                                message="Chưa có seal khả dụng"
                                                description="Không tìm thấy seal ACTIVE nào cho chuyến xe này."
                                                type="warning"
                                                showIcon
                                            />
                                        )}
                                    </Space>
                                </Card>
                        </Col>
                    </Row>
                </div>
            );
        }

        // IN_PROGRESS status - Waiting for driver confirmation
        if (issue.status === 'IN_PROGRESS') {
            return (
                <div className="seal-replacement-container">
                    <Alert
                        message={
                            <Space>
                                <ClockCircleOutlined />
                                <Text strong>Đang chờ tài xế xác nhận</Text>
                            </Space>
                        }
                        description="Seal mới đã được gán. Đang chờ tài xế gắn seal mới và xác nhận."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Card 
                                title={
                                    <Space>
                                        <LockOutlined style={{ color: '#ff4d4f' }} />
                                        <span>Seal cũ (đã gỡ)</span>
                                    </Space>
                                }
                                bordered={false}
                                style={{ 
                                    height: '100%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderTop: '3px solid #ff4d4f'
                                }}
                            >
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div>
                                        <Text type="secondary">Mã seal:</Text>
                                        <br />
                                        <Tag color="red" style={{ fontSize: 16, padding: '4px 12px', marginTop: 4 }}>
                                            <SafetyOutlined /> {issue.oldSeal?.sealCode || 'N/A'}
                                        </Tag>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    <div>
                                        <Space>
                                            <CameraOutlined />
                                            <Text strong>Ảnh seal bị gỡ:</Text>
                                        </Space>
                                        <div style={{ marginTop: 8 }}>
                                            {issue.sealRemovalImage ? (
                                                <Image
                                                    src={issue.sealRemovalImage}
                                                    alt="Seal bị gỡ"
                                                    width="100%"
                                                    style={{ 
                                                        borderRadius: 8,
                                                        border: '2px solid #f0f0f0'
                                                    }}
                                                    preview={{
                                                        mask: <div>Xem ảnh</div>
                                                    }}
                                                />
                                            ) : (
                                                <Text type="secondary">Không có ảnh</Text>
                                            )}
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card 
                                title={
                                    <Space>
                                        <SafetyOutlined style={{ color: '#52c41a' }} />
                                        <span>Seal mới (đã gán)</span>
                                    </Space>
                                }
                                bordered={false}
                                style={{ 
                                    height: '100%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderTop: '3px solid #52c41a'
                                }}
                            >
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div>
                                        <Text type="secondary">Mã seal:</Text>
                                        <br />
                                        <Tag color="green" style={{ fontSize: 16, padding: '4px 12px', marginTop: 4 }}>
                                            <SafetyOutlined /> {issue.newSeal?.sealCode || 'N/A'}
                                        </Tag>
                                    </div>

                                    <div>
                                        <Text type="secondary">Trạng thái:</Text>
                                        <br />
                                        <Tag color={getSealStatusColor(issue.newSeal?.status || 'IN_USE')} style={{ marginTop: 4 }}>
                                            {getSealStatusLabel(issue.newSeal?.status || 'IN_USE')}
                                        </Tag>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    <div>
                                        <Space>
                                            <UserOutlined />
                                            <Text strong>Nhân viên xử lý:</Text>
                                        </Space>
                                        <div style={{ marginTop: 8 }}>
                                            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                                                {issue.staff?.fullName || 'N/A'}
                                            </Tag>
                                        </div>
                                    </div>

                                    <Alert
                                        message="Đang chờ xác nhận"
                                        description="Tài xế đang gắn seal mới và sẽ xác nhận sau khi hoàn thành."
                                        type="info"
                                        showIcon
                                        icon={<ClockCircleOutlined />}
                                    />
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
            );
        }

        // RESOLVED status - Completed
        if (issue.status === 'RESOLVED') {
            return (
                <div className="seal-replacement-container">
                    <Alert
                        message={
                            <Space>
                                <CheckCircleOutlined />
                                <Text strong>Đã hoàn thành thay thế seal</Text>
                            </Space>
                        }
                        description="Tài xế đã xác nhận gắn seal mới thành công. Chuyến xe có thể tiếp tục."
                        type="success"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Card 
                                title={
                                    <Space>
                                        <LockOutlined style={{ color: '#ff4d4f' }} />
                                        <span>Seal cũ (đã gỡ)</span>
                                    </Space>
                                }
                                bordered={false}
                                style={{ 
                                    height: '100%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderTop: '3px solid #ff4d4f'
                                }}
                            >
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div>
                                        <Text type="secondary">Mã seal:</Text>
                                        <br />
                                        <Tag color="red" style={{ fontSize: 16, padding: '4px 12px', marginTop: 4 }}>
                                            <SafetyOutlined /> {issue.oldSeal?.sealCode || 'N/A'}
                                        </Tag>
                                    </div>

                                    <div>
                                        <Text type="secondary">Trạng thái:</Text>
                                        <br />
                                        <Tag color={getSealStatusColor('REMOVED')} style={{ marginTop: 4 }}>
                                            {getSealStatusLabel('REMOVED')}
                                        </Tag>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    <div>
                                        <Space>
                                            <CameraOutlined />
                                            <Text strong>Ảnh seal bị gỡ:</Text>
                                        </Space>
                                        <div style={{ marginTop: 8 }}>
                                            {issue.sealRemovalImage ? (
                                                <Image
                                                    src={issue.sealRemovalImage}
                                                    alt="Seal bị gỡ"
                                                    width="100%"
                                                    style={{ 
                                                        borderRadius: 8,
                                                        border: '2px solid #f0f0f0'
                                                    }}
                                                    preview={{
                                                        mask: <div>Xem ảnh</div>
                                                    }}
                                                />
                                            ) : (
                                                <Text type="secondary">Không có ảnh</Text>
                                            )}
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card 
                                title={
                                    <Space>
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                        <span>Seal mới (đã gắn)</span>
                                    </Space>
                                }
                                bordered={false}
                                style={{ 
                                    height: '100%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderTop: '3px solid #52c41a'
                                }}
                            >
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div>
                                        <Text type="secondary">Mã seal:</Text>
                                        <br />
                                        <Tag color="green" style={{ fontSize: 16, padding: '4px 12px', marginTop: 4 }}>
                                            <SafetyOutlined /> {issue.newSeal?.sealCode || 'N/A'}
                                        </Tag>
                                    </div>

                                    <div>
                                        <Text type="secondary">Trạng thái:</Text>
                                        <br />
                                        <Tag color={getSealStatusColor('IN_USE')} style={{ marginTop: 4 }}>
                                            {getSealStatusLabel('IN_USE')}
                                        </Tag>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    <div>
                                        <Space>
                                            <CameraOutlined />
                                            <Text strong>Ảnh seal mới:</Text>
                                        </Space>
                                        <div style={{ marginTop: 8 }}>
                                            {issue.newSealAttachedImage ? (
                                                <Image
                                                    src={issue.newSealAttachedImage}
                                                    alt="Seal mới"
                                                    width="100%"
                                                    style={{ 
                                                        borderRadius: 8,
                                                        border: '2px solid #f0f0f0'
                                                    }}
                                                    preview={{
                                                        mask: <div>Xem ảnh</div>
                                                    }}
                                                />
                                            ) : (
                                                <Text type="secondary">Không có ảnh</Text>
                                            )}
                                        </div>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    <div>
                                        <Space>
                                            <ClockCircleOutlined />
                                            <Text strong>Thời gian xác nhận:</Text>
                                        </Space>
                                        <div style={{ marginTop: 8 }}>
                                            <Text>
                                                {issue.newSealConfirmedAt
                                                    ? new Date(issue.newSealConfirmedAt).toLocaleString('vi-VN', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'N/A'}
                                            </Text>
                                        </div>
                                    </div>

                                    <div>
                                        <Space>
                                            <UserOutlined />
                                            <Text strong>Nhân viên xử lý:</Text>
                                        </Space>
                                        <div style={{ marginTop: 8 }}>
                                            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                                                {issue.staff?.fullName || 'N/A'}
                                            </Tag>
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
            );
        }

        return null;
    };

    return <div>{renderContent()}</div>;
};

export default SealReplacementDetail;
