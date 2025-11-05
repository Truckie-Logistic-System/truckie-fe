import React, { useState, useEffect } from 'react';
import { Card, Image, Button, Select, message, Modal, Space, Tag, Alert, Typography, Row, Col, Divider } from 'antd';
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
import type { Issue, Seal } from '@/models/Issue';
import issueService from '@/services/issue/issueService';
import { useAuth } from '@/context/AuthContext';
import { getSealStatusLabel, getSealStatusColor } from '@/constants/sealConstants';

const { Text } = Typography;

const { confirm } = Modal;

interface SealReplacementDetailProps {
    issue: Issue;
    onUpdate: (updatedIssue: Issue) => void;
}

const SealReplacementDetail: React.FC<SealReplacementDetailProps> = ({ issue, onUpdate }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeSeals, setActiveSeals] = useState<Seal[]>([]);
    const [selectedSealId, setSelectedSealId] = useState<string | null>(null);
    const [loadingSeals, setLoadingSeals] = useState(false);

    // Debug log
    console.log('[SealReplacementDetail] Component rendered:', {
        user,
        userRole: user?.role,
        issueStatus: issue.status,
        issueId: issue.id
    });

    // Auto-fetch active seals when component mounts or issue changes
    useEffect(() => {
        console.log('[SealReplacementDetail] useEffect triggered:', {
            status: issue.status,
            vehicleAssignmentId: issue.vehicleAssignment?.id,
            shouldFetch: issue.status === 'OPEN' && !!issue.vehicleAssignment?.id
        });
        
        if (issue.status === 'OPEN' && issue.vehicleAssignment?.id) {
            console.log('[SealReplacementDetail] Calling fetchActiveSeals...');
            fetchActiveSeals();
        }
    }, [issue.id, issue.status]);

    // Fetch active seals for selection
    const fetchActiveSeals = async () => {
        console.log('[SealReplacementDetail] fetchActiveSeals called');
        console.log('[SealReplacementDetail] vehicleAssignment:', issue.vehicleAssignment);
        
        if (!issue.vehicleAssignment?.id) {
            console.log('[SealReplacementDetail] No vehicleAssignment.id, returning');
            return;
        }

        console.log('[SealReplacementDetail] Fetching active seals for vehicleAssignment:', issue.vehicleAssignment.id);
        setLoadingSeals(true);
        try {
            const seals = await issueService.getActiveSeals(issue.vehicleAssignment.id);
            console.log('[SealReplacementDetail] Received seals:', seals);
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
        console.log('[SealReplacementDetail] 🖱️ Button clicked - handleAssignNewSeal');
        console.log('[SealReplacementDetail] Selected seal ID:', selectedSealId);
        console.log('[SealReplacementDetail] User:', user);
        console.log('[SealReplacementDetail] Issue ID:', issue.id);
        
        if (!selectedSealId || !user) {
            console.log('[SealReplacementDetail] ❌ Missing required data');
            console.log('- selectedSealId:', selectedSealId);
            console.log('- user:', user);
            return;
        }

        console.log('[SealReplacementDetail] ✅ All data valid, showing confirm dialog');
        
        confirm({
            title: 'Xác nhận gán seal mới',
            content: `Bạn có chắc muốn gán seal mới cho sự cố này?`,
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                console.log('[SealReplacementDetail] 🚀 User confirmed - starting API call');
                setLoading(true);
                try {
                    console.log('[SealReplacementDetail] 📡 Calling issueService.assignNewSeal...');
                    const updated = await issueService.assignNewSeal(issue.id, selectedSealId, user.id);
                    console.log('[SealReplacementDetail] ✅ API call successful:', updated);
                    console.log('[SealReplacementDetail] 🔄 Calling onUpdate...');
                    onUpdate(updated);
                    console.log('[SealReplacementDetail] 📢 Showing success message');
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
                    console.log('[SealReplacementDetail] 🔄 Resetting loading state');
                    setLoading(false);
                }
            },
            onCancel: () => {
                console.log('[SealReplacementDetail] ❌ User cancelled the confirmation');
            }
        });
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
                            {(() => {
                                console.log('[SealReplacementDetail] Checking user role:', {
                                    user,
                                    role: user?.role,
                                    isStaff: user?.role === 'staff',
                                    shouldShowCard: user?.role === 'staff'
                                });
                                return user?.role === 'staff';
                            })() && (
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
                                        ) : activeSeals.length > 0 ? (
                                            <>
                                                <div>
                                                    <Text strong style={{ marginBottom: 8, display: 'block' }}>
                                                        Chọn seal mới ({activeSeals.length} seal khả dụng):
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
                                                        {activeSeals.map((seal) => (
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
                                                    onClick={handleAssignNewSeal}
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
                            )}
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
