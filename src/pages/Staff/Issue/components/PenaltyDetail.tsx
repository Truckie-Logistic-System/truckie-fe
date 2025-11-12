import React from 'react';
import { Card, Row, Col, Space, Typography, Image, Alert } from 'antd';
import { 
    ExclamationCircleOutlined,
    PictureOutlined,
    WarningOutlined
} from '@ant-design/icons';
import type { Issue } from '@/models/Issue';

const { Text, Title, Paragraph } = Typography;

interface PenaltyDetailProps {
    issue: Issue;
}

/**
 * Component hiển thị chi tiết vi phạm giao thông
 * Staff chỉ xem thông tin, làm việc với tài xế offline
 * Sau đó cập nhật issue status sang RESOLVED
 */
const PenaltyDetail: React.FC<PenaltyDetailProps> = ({ issue }) => {
    // Extract violation type from description (format: "Vi phạm giao thông: [violation type]")
    const violationType = issue.description?.replace('Vi phạm giao thông: ', '') || 'Không xác định';

    return (
        <Card 
            className="shadow-md"
            style={{ borderRadius: 8 }}
        >
            {/* Header with gradient */}
            <div style={{ 
                background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                margin: '-24px -24px 24px -24px',
                padding: '20px 24px',
                borderRadius: '8px 8px 0 0'
            }}>
                <Space>
                    <WarningOutlined style={{ fontSize: 24, color: 'white' }} />
                    <Title level={4} style={{ margin: 0, color: 'white' }}>
                        Chi tiết vi phạm giao thông
                    </Title>
                </Space>
            </div>

            {/* Alert hướng dẫn staff */}
            {/* <Alert
                message="Hướng dẫn xử lý"
                description={
                    <div>
                        <Paragraph style={{ marginBottom: 8 }}>
                            📋 <strong>Quy trình xử lý vi phạm giao thông:</strong>
                        </Paragraph>
                        <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
                            <li>Xem thông tin vi phạm và biên bản dưới đây</li>
                            <li>Liên hệ và làm việc trực tiếp với tài xế (ngoài hệ thống)</li>
                            <li>Sau khi xử lý xong, cập nhật trạng thái sự cố sang <strong>"Đã giải quyết"</strong></li>
                        </ol>
                    </div>
                }
                type="info"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 24 }}
            /> */}

            <Row gutter={[16, 16]}>
                {/* Violation Type */}
                <Col xs={24}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                        padding: 16,
                        borderRadius: 8,
                        border: '2px solid #c084fc'
                    }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <Space>
                                <WarningOutlined style={{ color: '#9333ea', fontSize: 18 }} />
                                <Text strong style={{ fontSize: 16, color: '#7e22ce' }}>
                                    Loại vi phạm
                                </Text>
                            </Space>
                            <Text style={{ fontSize: 15, color: '#333' }}>
                                {violationType}
                            </Text>
                        </Space>
                    </div>
                </Col>

                {/* Traffic Violation Record Images */}
                {issue.issueImages && issue.issueImages.length > 0 && (
                    <Col xs={24}>
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: 16, 
                            borderRadius: 8,
                            border: '1px solid #e9ecef'
                        }}>
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <Space>
                                    <PictureOutlined style={{ color: '#9333ea', fontSize: 18 }} />
                                    <Text strong style={{ fontSize: 16 }}>
                                        Biên bản vi phạm giao thông
                                    </Text>
                                </Space>
                                
                                <Image.PreviewGroup>
                                    <Row gutter={[16, 16]}>
                                        {issue.issueImages.map((imageUrl, index) => (
                                            <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                                <div style={{ 
                                                    border: '2px solid #9333ea',
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    padding: 8,
                                                    background: 'white'
                                                }}>
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`Biên bản vi phạm ${index + 1}`}
                                                        style={{ 
                                                            width: '100%',
                                                            height: 200,
                                                            objectFit: 'cover',
                                                            borderRadius: 4
                                                        }}
                                                        preview={{
                                                            mask: 'Xem chi tiết',
                                                        }}
                                                    />
                                                    <Text 
                                                        type="secondary" 
                                                        style={{ 
                                                            fontSize: 12,
                                                            display: 'block',
                                                            textAlign: 'center',
                                                            marginTop: 8
                                                        }}
                                                    >
                                                        Ảnh {index + 1}
                                                    </Text>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </Image.PreviewGroup>
                            </Space>
                        </div>
                    </Col>
                )}

                {/* Note về việc không có hình ảnh */}
                {(!issue.issueImages || issue.issueImages.length === 0) && (
                    <Col xs={24}>
                        <Alert
                            message="Không có hình ảnh biên bản"
                            description="Tài xế chưa tải lên hình ảnh biên bản vi phạm giao thông."
                            type="warning"
                            showIcon
                        />
                    </Col>
                )}
            </Row>
        </Card>
    );
};

export default PenaltyDetail;
