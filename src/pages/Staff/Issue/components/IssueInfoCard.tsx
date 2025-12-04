import React from 'react';
import { Card, Row, Col, Space, Tag, Typography } from 'antd';
import { 
    FileTextOutlined, 
    ClockCircleOutlined,
    UserOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { IssueStatusTag } from '@/components/common/tags';
import { IssueEnum, getIssueTypeLabel } from '@/constants/enums';
import type { Issue } from '@/models/Issue';
import MapPreview from './MapPreview';

const { Text, Title } = Typography;

interface IssueInfoCardProps {
    issue: Issue;
}

const IssueInfoCard: React.FC<IssueInfoCardProps> = ({ issue }) => {
    return (
        <Card 
            className="shadow-md"
            style={{ borderRadius: 8 }}
        >
            {/* Header with gradient */}
            <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                margin: '-24px -24px 24px -24px',
                padding: '20px 24px',
                borderRadius: '8px 8px 0 0'
            }}>
                <Space size="large" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Space>
                        <ExclamationCircleOutlined style={{ fontSize: 24, color: 'white' }} />
                        <Title level={4} style={{ margin: 0, color: 'white' }}>
                            Thông tin sự cố
                        </Title>
                    </Space>
                    <IssueStatusTag status={issue.status as IssueEnum} />
                </Space>
            </div>

            {/* Content */}
            <Row gutter={[16, 16]}>
                {/* Left Column - Info */}
                <Col xs={24} lg={16}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {/* Description */}
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: 16, 
                            borderRadius: 8,
                            border: '1px solid #e9ecef'
                        }}>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <Space>
                                    <FileTextOutlined style={{ color: '#6c757d', fontSize: 16 }} />
                                    <Text strong style={{ fontSize: 15 }}>Mô tả sự cố</Text>
                                </Space>
                                <Text style={{ fontSize: 14, color: '#495057' }}>
                                    {issue.description || 'Không có mô tả'}
                                </Text>
                            </Space>
                        </div>

                        <Row gutter={[16, 16]}>
                            {/* Issue Type */}
                            <Col xs={24} md={12}>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #fff5e6 0%, #ffe0b3 100%)',
                                    padding: 16,
                                    borderRadius: 8,
                                    border: '2px solid #ffb84d',
                                    height: '100%'
                                }}>
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        <Space>
                                            <ExclamationCircleOutlined style={{ color: '#ff8c00', fontSize: 16 }} />
                                            <Text strong style={{ fontSize: 15, color: '#ff8c00' }}>
                                                Loại sự cố
                                            </Text>
                                        </Space>
                                        <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
                                            {getIssueTypeLabel(issue.issueTypeEntity?.issueTypeName || '')}
                                        </Tag>
                                        {issue.issueTypeEntity?.description && (
                                            <Text type="secondary" style={{ fontSize: 13 }}>
                                                {issue.issueTypeEntity.description}
                                            </Text>
                                        )}
                                    </Space>
                                </div>
                            </Col>

                            {/* Staff Assigned */}
                            <Col xs={24} md={12}>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                    padding: 16,
                                    borderRadius: 8,
                                    border: '2px solid #81c784',
                                    height: '100%'
                                }}>
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        <Space>
                                            <UserOutlined style={{ color: '#2e7d32', fontSize: 16 }} />
                                            <Text strong style={{ fontSize: 15, color: '#2e7d32' }}>
                                                Nhân viên phụ trách
                                            </Text>
                                        </Space>
                                        {issue.staff ? (
                                            <>
                                                <Text strong style={{ fontSize: 14 }}>
                                                    {issue.staff.fullName}
                                                </Text>
                                                {issue.staff.phoneNumber && (
                                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                                        📞 {issue.staff.phoneNumber}
                                                    </Text>
                                                )}
                                            </>
                                        ) : (
                                            <Tag color="default">Chưa phân công</Tag>
                                        )}
                                    </Space>
                                </div>
                            </Col>

                            {/* Reported Time */}
                            <Col xs={24}>
                                <div style={{ 
                                    background: '#f8f9fa', 
                                    padding: 16, 
                                    borderRadius: 8,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                        <Space>
                                            <ClockCircleOutlined style={{ color: '#6c757d', fontSize: 16 }} />
                                            <Text strong style={{ fontSize: 15 }}>Thời gian báo cáo</Text>
                                        </Space>
                                        <Text style={{ fontSize: 14 }}>
                                            {issue.reportedAt 
                                                ? new Date(issue.reportedAt).toLocaleString('vi-VN')
                                                : 'Không có thông tin'
                                            }
                                        </Text>
                                    </Space>
                                </div>
                            </Col>
                        </Row>
                    </Space>
                </Col>

                {/* Right Column - Map */}
                {issue.locationLatitude && issue.locationLongitude && (
                    <Col xs={24} lg={8}>
                        <MapPreview 
                            latitude={issue.locationLatitude}
                            longitude={issue.locationLongitude}
                            size={250}
                        />
                    </Col>
                )}

                {/* Resolved Time (if resolved) */}
                {issue.resolvedAt && (
                    <Col xs={24}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                            padding: 16,
                            borderRadius: 8,
                            border: '2px solid #64b5f6'
                        }}>
                            <Space>
                                <ClockCircleOutlined style={{ color: '#1976d2', fontSize: 16 }} />
                                <Text strong style={{ fontSize: 15, color: '#1976d2' }}>
                                    Thời gian giải quyết:
                                </Text>
                                <Text style={{ fontSize: 14 }}>
                                    {new Date(issue.resolvedAt).toLocaleString('vi-VN')}
                                </Text>
                            </Space>
                        </div>
                    </Col>
                )}
            </Row>
        </Card>
    );
};

export default IssueInfoCard;
