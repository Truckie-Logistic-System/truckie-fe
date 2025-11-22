import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Skeleton,
    message,
    Row,
    Col,
    App
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import issueService from '@/services/issue';
import type { Issue } from '@/models/Issue';
import SealReplacementDetail from '../../../Admin/Issues/components/SealReplacementDetail';
import VehicleDriverInfo from './VehicleDriverInfo';
import IssueInfoCard from './IssueInfoCard';
import RefundProcessingDetail from './RefundProcessingDetail';
import PenaltyDetail from './PenaltyDetail';
import OrderRejectionDetail from './OrderRejectionDetail';
import RerouteDetail from './RerouteDetail';
import issueWebSocket from '@/services/websocket/issueWebSocket';

const IssueDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { modal } = App.useApp();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [resolvingPenalty, setResolvingPenalty] = useState<boolean>(false);

    // Lấy thông tin sự cố khi component mount
    useEffect(() => {
        if (id) {
            fetchIssueDetails(id);
        }
    }, [id]);

    // Subscribe to real-time issue updates via WebSocket
    useEffect(() => {
        if (!id) return;
        const unsubscribe = issueWebSocket.subscribeToIssue(id, (updatedIssue) => {
            // Show notification to user
            message.success('Sự cố đã được cập nhật! Đang tải lại dữ liệu...');
            
            // Refresh issue details from API
            fetchIssueDetails(id);
        });

        return () => {
            unsubscribe();
        };
    }, [id]);

    // Hàm lấy thông tin chi tiết sự cố từ API
    const fetchIssueDetails = async (issueId: string) => {
        
        setLoading(true);
        try {
            const data = await issueService.getIssueById(issueId);
            
            setIssue(data);
            console.log(data);
        } catch (error) {
            message.error('Không thể tải thông tin sự cố');
            console.error('Error fetching issue details:', error);
        } finally {
            setLoading(false);
        }
    };


    // Xử lý khi issue được update (cho SealReplacementDetail)
    const handleIssueUpdate = (updatedIssue: Issue) => {
        setIssue(updatedIssue);
    };

    // Xử lý xác nhận giải quyết penalty issue
    const handleResolvePenalty = () => {
        if (!id || !issue) {
            return;
        }
        modal.confirm({
            title: 'Xác nhận đã giải quyết',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn đã làm việc với tài xế và giải quyết xong vi phạm giao thông này?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            centered: true,
            okButtonProps: {
                style: {
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a'
                }
            },
            onOk: async () => {
                setResolvingPenalty(true);
                try {
                    await issueService.updateIssueStatus(id, 'RESOLVED');
                    message.success('Đã xác nhận giải quyết vi phạm giao thông thành công');
                    fetchIssueDetails(id);
                } catch (error) {
                    message.error('Không thể cập nhật trạng thái');
                    console.error('Error resolving penalty issue:', error);
                } finally {
                    setResolvingPenalty(false);
                }
            },
            onCancel: () => {
            }
        });
    };

    if (loading) {
        return (
            <div className="p-6">
                {/* Header skeleton */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <Skeleton.Button active size="large" shape="round" className="mr-4" />
                        <Skeleton.Input active size="large" style={{ width: 200 }} />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton.Button active size="default" shape="round" />
                        <Skeleton.Button active size="default" shape="round" />
                        <Skeleton.Button active size="default" shape="round" />
                    </div>
                </div>

                {/* Issue info skeleton */}
                <Card className="shadow-md mb-4">
                    <Skeleton active paragraph={{ rows: 6 }} />
                </Card>

                {/* Issue details skeleton */}
                <Card className="shadow-md mb-4">
                    <Skeleton active paragraph={{ rows: 4 }} />
                </Card>

                {/* Timeline skeleton */}
                <Card className="shadow-md">
                    <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="p-6">
                <Card>
                    <div className="text-center py-8">
                        <h2 className="text-xl font-semibold mb-2">Không tìm thấy sự cố</h2>
                        <p className="text-gray-500 mb-4">Sự cố không tồn tại hoặc đã bị xóa</p>
                        <Button type="primary" onClick={() => navigate('/staff/issues')}>
                            Quay lại danh sách sự cố
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Debug log
    

    return (
        <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
                <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/staff/issues')}
                >
                    Quay lại danh sách
                </Button>
                {/* Chỉ hiển thị nút xác nhận giải quyết cho PENALTY issues và status OPEN */}
                {(issue.issueCategory === 'PENALTY' || issue.issueTypeEntity?.issueCategory === 'PENALTY') && 
                 issue.status === 'OPEN' && (
                    <div>
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={handleResolvePenalty}
                            loading={resolvingPenalty}
                            size="large"
                            style={{ 
                                backgroundColor: '#52c41a',
                                borderColor: '#52c41a',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#73d13d';
                                e.currentTarget.style.borderColor = '#73d13d';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(82, 196, 26, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#52c41a';
                                e.currentTarget.style.borderColor = '#52c41a';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            Xác nhận đã giải quyết
                        </Button>
                    </div>
                )}
            </div>

            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <IssueInfoCard issue={issue} />
                </Col>

                <Col span={24}>
                    <VehicleDriverInfo vehicleAssignment={issue.vehicleAssignment} />
                </Col>

                {/* Seal Replacement Detail - Hiển thị khi issue là loại seal replacement */}
                {(issue.issueCategory === 'SEAL_REPLACEMENT' || issue.issueTypeEntity?.issueCategory === 'SEAL_REPLACEMENT') && (
                    <Col span={24}>
                        <Card title="Xử lý thay thế seal" className="shadow-md mb-4">
                            <SealReplacementDetail 
                                issue={issue} 
                                onUpdate={handleIssueUpdate} 
                            />
                        </Card>
                    </Col>
                )}

                {/* Refund Processing Detail - Hiển thị khi issue là loại damage */}
                {(() => {
                    const isDamageCategory = issue.issueCategory === 'DAMAGE' || issue.issueTypeEntity?.issueCategory === 'DAMAGE';
                    const hasOrderDetail = issue.orderDetailEntity || issue.orderDetail;
                    return isDamageCategory && hasOrderDetail;
                })() && (
                    <Col span={24}>
                        <RefundProcessingDetail 
                            issue={issue}
                            orderDetailId={issue.orderDetailEntity?.id || ''}
                            onUpdate={handleIssueUpdate} 
                        />
                    </Col>
                )}

                {/* Penalty Detail - Hiển thị khi issue là loại penalty (vi phạm giao thông) */}
                {(issue.issueCategory === 'PENALTY' || issue.issueTypeEntity?.issueCategory === 'PENALTY') && (
                    <Col span={24}>
                        <PenaltyDetail issue={issue} />
                    </Col>
                )}

                {/* Order Rejection Detail - Hiển thị khi issue là loại người nhận từ chối */}
                {(issue.issueCategory === 'ORDER_REJECTION' || issue.issueTypeEntity?.issueCategory === 'ORDER_REJECTION') && (
                    <Col span={24}>
                        <OrderRejectionDetail 
                            issue={issue}
                            onUpdate={handleIssueUpdate} 
                        />
                    </Col>
                )}

                {/* Reroute Detail - Hiển thị khi issue là loại tái định tuyến */}
                {(issue.issueCategory === 'REROUTE' || issue.issueTypeEntity?.issueCategory === 'REROUTE') && (
                    <Col span={24}>
                        <RerouteDetail 
                            issue={issue}
                            onUpdate={handleIssueUpdate} 
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default IssueDetail;