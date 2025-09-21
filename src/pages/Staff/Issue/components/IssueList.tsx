import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Card, Skeleton, message, Tooltip, Typography, Badge, Row, Col } from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    EnvironmentOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    AlertOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import issueService from '@/services/issue';
import type { Issue } from '@/models/Issue';
import { IssueEnum } from '@/constants/enums';
import { IssueStatusTag } from '@/components/common';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

const IssueList: React.FC = () => {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const navigate = useNavigate();

    // Lấy danh sách sự cố khi component mount
    useEffect(() => {
        fetchIssues();
    }, []);

    // Hàm lấy danh sách sự cố từ API
    const fetchIssues = async () => {
        setLoading(true);
        setIsFetching(true);
        try {
            const data = await issueService.getAllIssues();
            setIssues(data);
        } catch (error) {
            message.error('Không thể tải danh sách sự cố');
            console.error('Error fetching issues:', error);
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    };

    // Xử lý khi click vào nút xem chi tiết
    const handleViewDetails = (issueId: string) => {
        navigate(`/staff/issues/${issueId}`);
    };

    // Xử lý khi click vào nút xem vị trí
    const handleViewLocation = (issue: Issue) => {
        if (issue.locationLatitude && issue.locationLongitude) {
            navigate(`/staff/map?lat=${issue.locationLatitude}&lng=${issue.locationLongitude}&title=Sự cố: ${issue.description}`);
        } else {
            message.warning('Không có thông tin vị trí cho sự cố này');
        }
    };

    // Lọc sự cố theo từ khóa tìm kiếm và trạng thái
    const filteredIssues = issues.filter(issue => {
        const matchesSearch = (
            issue.description.toLowerCase().includes(searchText.toLowerCase()) ||
            (issue.vehicleAssignment?.vehicle?.licensePlateNumber || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (issue.staff?.fullName || '').toLowerCase().includes(searchText.toLowerCase())
        );

        const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Thống kê sự cố theo trạng thái
    const getIssueStats = () => {
        const pendingIssues = issues.filter(issue => issue.status === IssueEnum.OPEN).length;
        const inProgressIssues = issues.filter(issue => issue.status === IssueEnum.IN_PROGRESS).length;
        const resolvedIssues = issues.filter(issue => issue.status === IssueEnum.RESOLVED).length;
        const cancelledIssues = 0; // Không còn trạng thái này trong enum mới

        return { pendingIssues, inProgressIssues, resolvedIssues, cancelledIssues };
    };

    const stats = getIssueStats();

    // Render stats card theo layout của Admin
    const renderStatCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Chờ xử lý</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-orange-800">{stats.pendingIssues}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.pendingIssues} color="orange" showZero>
                        <div className="bg-orange-200 p-2 rounded-full">
                            <ClockCircleOutlined className="text-3xl text-orange-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đang xử lý</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-blue-800">{stats.inProgressIssues}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.inProgressIssues} color="blue" showZero>
                        <div className="bg-blue-200 p-2 rounded-full">
                            <ClockCircleOutlined className="text-3xl text-blue-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đã giải quyết</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-green-700">{stats.resolvedIssues}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.resolvedIssues} color="green" showZero>
                        <div className="bg-green-200 p-2 rounded-full">
                            <CheckCircleOutlined className="text-3xl text-green-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đã hủy</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-red-700">{stats.cancelledIssues}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.cancelledIssues} color="red" showZero>
                        <div className="bg-red-200 p-2 rounded-full">
                            <ExclamationCircleOutlined className="text-3xl text-red-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
        </div>
    );

    // Định nghĩa các cột cho bảng
    const columns = [
        {
            title: 'Mã sự cố',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => (
                <a
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => handleViewDetails(id)}
                >
                    {id.substring(0, 8)}...
                </a>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: { showTitle: false },
            render: (description: string) => (
                <Tooltip title={description}>
                    <span>{description.length > 30 ? `${description.substring(0, 30)}...` : description}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Phương tiện',
            key: 'vehicle',
            render: (_: any, record: Issue) => record.vehicleAssignment?.vehicle?.licensePlateNumber || 'Không xác định',
        },
        {
            title: 'Tài xế',
            key: 'driver',
            render: (_: any, record: Issue) => {
                const driver = record.vehicleAssignment?.driver1;
                return driver ? driver.id || 'Không xác định' : 'Không xác định';
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <IssueStatusTag status={status as IssueEnum} />,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Issue) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record.id)}
                        className="bg-blue-500 hover:bg-blue-600"
                        size="small"
                    >
                        Chi tiết
                    </Button>
                    {(record.locationLatitude && record.locationLongitude) && (
                        <Button
                            type="default"
                            icon={<EnvironmentOutlined />}
                            onClick={() => handleViewLocation(record)}
                            size="small"
                        >
                            Vị trí
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <AlertOutlined className="mr-3 text-blue-600" /> Quản lý sự cố
                        </Title>
                        <Text type="secondary">Quản lý và xử lý các sự cố phát sinh trong quá trình vận chuyển</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined spin={isFetching} />}
                        onClick={fetchIssues}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                        loading={isFetching}
                    >
                        Làm mới
                    </Button>
                </div>

                {renderStatCards()}

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">Danh sách sự cố</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder="Tìm kiếm theo mô tả, biển số xe, nhân viên..."
                                prefix={<SearchOutlined />}
                                className="w-full md:w-64"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                disabled={loading}
                            />
                            <Select
                                defaultValue="all"
                                style={{ width: 200 }}
                                onChange={(value) => setStatusFilter(value)}
                                className="rounded-md"
                                disabled={loading}
                            >
                                <Option value="all">Tất cả trạng thái</Option>
                                <Option value={IssueEnum.OPEN}>Chờ xử lý</Option>
                                <Option value={IssueEnum.IN_PROGRESS}>Đang xử lý</Option>
                                <Option value={IssueEnum.RESOLVED}>Đã giải quyết</Option>
                            </Select>
                        </div>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredIssues}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showTotal: (total) => `Tổng ${total} sự cố`
                        }}
                        loading={{
                            spinning: loading,
                            indicator: <></>
                        }}
                        className="issue-table"
                        rowClassName="hover:bg-blue-50 transition-colors"
                        locale={{
                            emptyText: loading ? (
                                <div className="py-5">
                                    <Skeleton active paragraph={{ rows: 5 }} />
                                </div>
                            ) : 'Không có dữ liệu'
                        }}
                        scroll={{ x: 'max-content' }}
                        onRow={(record) => ({
                            onClick: () => handleViewDetails(record.id),
                            style: { cursor: 'pointer' }
                        })}
                    />
                </Card>
            </div>
        </div>
    );
};

export default IssueList; 