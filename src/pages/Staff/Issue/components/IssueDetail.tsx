import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, message, Tag, Divider, Row, Col, Modal, Form, Select } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import issueService from '@/services/issue';
import type { Issue, IssueStatus } from '@/models/Issue';
import { getIssueStatusColor, getIssueStatusLabel, getVehicleInfo, getDriverFullName } from '@/models/Issue';
import dayjs from 'dayjs';

const { confirm } = Modal;
const { Option } = Select;

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

    // Xử lý khi click nút xóa sự cố
    const handleDelete = () => {
        if (!id) return;

        confirm({
            title: 'Xác nhận xóa sự cố',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn xóa sự cố này không? Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await issueService.deleteIssue(id);
                    message.success('Sự cố đã được xóa thành công');
                    navigate('/staff/issues');
                } catch (error) {
                    message.error('Không thể xóa sự cố');
                    console.error('Error deleting issue:', error);
                }
            },
        });
    };

    // Xử lý khi click nút sửa sự cố
    const handleEdit = () => {
        if (!id) return;
        navigate(`/staff/issues/edit/${id}`);
    };

    // Xử lý khi click nút xem vị trí
    const handleViewLocation = () => {
        if (issue && issue.locationLatitude && issue.locationLongitude) {
            navigate(`/staff/map?lat=${issue.locationLatitude}&lng=${issue.locationLongitude}&title=Sự cố: ${issue.description}`);
        } else {
            message.warning('Không có thông tin vị trí cho sự cố này');
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
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
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                        className="mr-2"
                    >
                        Chỉnh sửa
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDelete}
                    >
                        Xóa
                    </Button>
                </div>
            </div>

            <Row gutter={16}>
                <Col span={24}>
                    <Card title="Thông tin sự cố" className="shadow-md mb-4">
                        <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Mô tả">{issue.description}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={getIssueStatusColor(issue.status)}>
                                    {getIssueStatusLabel(issue.status)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại sự cố">
                                {issue.issueType?.issueTypeName || 'Không xác định'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Vị trí">
                                {issue.locationLatitude && issue.locationLongitude ? (
                                    <Button
                                        type="link"
                                        icon={<EnvironmentOutlined />}
                                        onClick={handleViewLocation}
                                        style={{ padding: 0 }}
                                    >
                                        Xem vị trí trên bản đồ
                                    </Button>
                                ) : 'Không có thông tin vị trí'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Nhân viên phụ trách">
                                {issue.staff?.fullName || 'Chưa phân công'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                {issue.vehicleAssignment && (
                    <Col span={24}>
                        <Card title="Thông tin phương tiện và tài xế" className="shadow-md mb-4">
                            <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
                                <Descriptions.Item label="Biển số xe">
                                    {issue.vehicleAssignment.vehicle?.licensePlateNumber || 'Không có thông tin'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Loại xe">
                                    {issue.vehicleAssignment.vehicle?.vehicleType?.vehicleTypeName || 'Không có thông tin'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Model">
                                    {issue.vehicleAssignment.vehicle?.model || 'Không có thông tin'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Hãng sản xuất">
                                    {issue.vehicleAssignment.vehicle?.manufacturer || 'Không có thông tin'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Năm sản xuất">
                                    {issue.vehicleAssignment.vehicle?.year || 'Không có thông tin'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Tài xế chính">
                                    {getDriverFullName(issue.vehicleAssignment.driver1)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Tài xế phụ">
                                    {getDriverFullName(issue.vehicleAssignment.driver2)}
                                </Descriptions.Item>
                            </Descriptions>
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
                        <Select>
                            <Option value="PENDING">Chờ xử lý</Option>
                            <Option value="IN_PROGRESS">Đang xử lý</Option>
                            <Option value="RESOLVED">Đã giải quyết</Option>
                            <Option value="CANCELLED">Đã hủy</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default IssueDetail; 