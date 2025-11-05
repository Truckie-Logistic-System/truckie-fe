import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Skeleton,
    Modal,
    Form,
    Select,
    message,
    Row,
    Col
} from 'antd';
import {
    ArrowLeftOutlined
} from '@ant-design/icons';
import issueService from '@/services/issue';
import type { Issue, IssueStatus } from '@/models/Issue';
import { IssueEnum, IssueStatusLabels } from '@/constants/enums';
import { enumToSelectOptions } from '@/utils/enumUtils';
import SealReplacementDetail from '../../../Admin/Issues/components/SealReplacementDetail';
import VehicleDriverInfo from './VehicleDriverInfo';
import IssueInfoCard from './IssueInfoCard';

const IssueDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateStatusModalVisible, setUpdateStatusModalVisible] = useState<boolean>(false);
    const [form] = Form.useForm();

    // Lấy thông tin sự cố khi component mount
    useEffect(() => {
        if (id) {
            fetchIssueDetails(id);
        }
    }, [id]);

    // Hàm lấy thông tin chi tiết sự cố từ API
    const fetchIssueDetails = async (issueId: string) => {
        setLoading(true);
        try {
            const data = await issueService.getIssueById(issueId);
            setIssue(data);
        } catch (error) {
            message.error('Không thể tải thông tin sự cố');
            console.error('Error fetching issue details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mở modal cập nhật trạng thái
    const showUpdateStatusModal = () => {
        if (issue) {
            form.setFieldsValue({ status: issue.status });
            setUpdateStatusModalVisible(true);
        }
    };

    // Xử lý khi submit form cập nhật trạng thái
    const handleUpdateStatus = async (values: { status: IssueStatus }) => {
        if (!id || !issue) return;

        try {
            await issueService.updateIssue(id, { status: values.status });
            message.success('Cập nhật trạng thái thành công');
            setUpdateStatusModalVisible(false);
            fetchIssueDetails(id);
        } catch (error) {
            message.error('Không thể cập nhật trạng thái');
            console.error('Error updating issue status:', error);
        }
    };

    // Xử lý khi issue được update (cho SealReplacementDetail)
    const handleIssueUpdate = (updatedIssue: Issue) => {
        setIssue(updatedIssue);
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
    console.log('[IssueDetail] Issue data:', {
        issueCategory: issue.issueCategory,
        issueTypeEntityCategory: issue.issueTypeEntity?.issueCategory,
        shouldShowSealReplacement: issue.issueCategory === 'SEAL_REPLACEMENT' || issue.issueTypeEntity?.issueCategory === 'SEAL_REPLACEMENT'
    });

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
                <div>
                    <Button
                        type="primary"
                        onClick={showUpdateStatusModal}
                        className="mr-2"
                    >
                        Cập nhật trạng thái
                    </Button>
                </div>
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
            </Row>

            {/* Modal cập nhật trạng thái */}
            <Modal
                title="Cập nhật trạng thái sự cố"
                open={updateStatusModalVisible}
                onCancel={() => setUpdateStatusModalVisible(false)}
                onOk={() => form.submit()}
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateStatus}
                >
                    <Form.Item
                        name="status"
                        label="Trạng thái"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                    >
                        <Select options={enumToSelectOptions(IssueEnum, IssueStatusLabels)} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default IssueDetail; 