import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Input, Select, Card, Skeleton, message, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import issueService from '@/services/issue';
import type { Issue, IssueStatus } from '@/models/Issue';
import { getIssueStatusColor, getIssueStatusLabel, getVehicleInfo, getDriverFullName } from '@/models/Issue';
import dayjs from 'dayjs';

const { Option } = Select;

const IssueList: React.FC = () => {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const navigate = useNavigate();

    // Lấy danh sách sự cố khi component mount
    useEffect(() => {
        fetchIssues();
    }, []);

    // Hàm lấy danh sách sự cố từ API
    const fetchIssues = async () => {
        setLoading(true);
        try {
            const data = await issueService.getAllIssues();
            setIssues(data);
        } catch (error) {
            message.error('Không thể tải danh sách sự cố');
            console.error('Error fetching issues:', error);
        } finally {
            setLoading(false);
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

    // Định nghĩa các cột cho bảng
    const columns = [
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text: string) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            )
        },
        {
            title: 'Loại sự cố',
            key: 'issueType',
            render: (_: any, record: Issue) => record.issueType?.issueTypeName || 'Không xác định',
        },
        {
            title: 'Phương tiện',
            key: 'vehicle',
            render: (_: any, record: Issue) => getVehicleInfo(record.vehicleAssignment?.vehicle),
        },
        {
            title: 'Tài xế',
            key: 'driver',
            render: (_: any, record: Issue) => getDriverFullName(record.vehicleAssignment?.driver1),
        },
        {
            title: 'Nhân viên phụ trách',
            key: 'staff',
            render: (_: any, record: Issue) => record.staff?.fullName || 'Chưa phân công',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: IssueStatus) => (
                <Tag color={getIssueStatusColor(status)}>
                    {getIssueStatusLabel(status)}
                </Tag>
            ),
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
                    >
                        Chi tiết
                    </Button>
                    {(record.locationLatitude && record.locationLongitude) && (
                        <Button
                            type="default"
                            icon={<EnvironmentOutlined />}
                            onClick={() => handleViewLocation(record)}
                        >
                            Vị trí
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card title="Danh sách sự cố" className="shadow-md">
                <div className="mb-4 flex flex-wrap gap-4 items-center">
                    <Input
                        placeholder="Tìm kiếm theo mô tả, biển số xe, nhân viên..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />

                    <Select
                        defaultValue="all"
                        style={{ width: 200 }}
                        onChange={(value) => setStatusFilter(value)}
                    >
                        <Option value="all">Tất cả trạng thái</Option>
                        <Option value="PENDING">Chờ xử lý</Option>
                        <Option value="IN_PROGRESS">Đang xử lý</Option>
                        <Option value="RESOLVED">Đã giải quyết</Option>
                        <Option value="CANCELLED">Đã hủy</Option>
                    </Select>

                    <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={fetchIssues}
                    >
                        Làm mới
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredIssues}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total) => `Tổng số ${total} vấn đề`
                    }}
                    loading={{
                        spinning: loading,
                        indicator: <></>
                    }}
                    locale={{
                        emptyText: loading ? (
                            <div className="py-5">
                                <Skeleton active paragraph={{ rows: 5 }} />
                            </div>
                        ) : 'Không có dữ liệu'
                    }}
                />
            </Card>
        </div>
    );
};

export default IssueList; 