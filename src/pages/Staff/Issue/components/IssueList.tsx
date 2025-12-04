import React, { useState, useEffect, useMemo } from 'react';
import { 
    Table, 
    Space, 
    Button, 
    Input, 
    Select, 
    Card, 
    Skeleton, 
    message, 
    Tooltip, 
    Typography, 
    Badge, 
    Row, 
    Col,
    DatePicker,
    Tag,
    Avatar
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    FilterOutlined,
    CalendarOutlined,
    UserOutlined,
    CarOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    AlertOutlined,
    SortAscendingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import issueService from '@/services/issue';
import type { Issue } from '@/models/Issue';
import { IssueEnum } from '@/constants/enums';
import { IssueStatusTag } from '@/components/common';
import { getIssueCategoryLabel, getIssueCategoryColor } from '@/models/Issue';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

interface FilterState {
    dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
    issueCategory: string;
    status: string;
    searchText: string;
}

interface SortState {
    field: string;
    order: 'ascend' | 'descend' | null;
}

const IssueList: React.FC = () => {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filters, setFilters] = useState<FilterState>({
        dateRange: null,
        issueCategory: 'all',
        status: 'all',
        searchText: ''
    });
    const [sort, setSort] = useState<SortState>({
        field: 'reportedAt',
        order: 'descend'
    });
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

    // Lọc và sắp xếp sự cố
    const filteredAndSortedIssues = useMemo(() => {
        let filtered = [...issues];

        // Lọc theo từ khóa tìm kiếm
        if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            filtered = filtered.filter(issue => 
                issue.description.toLowerCase().includes(searchLower) ||
                issue.id.toLowerCase().includes(searchLower) ||
                (issue.vehicleAssignmentEntity?.trackingCode || '').toLowerCase().includes(searchLower) ||
                (issue.vehicleAssignmentEntity?.vehicle?.licensePlateNumber || '').toLowerCase().includes(searchLower) ||
                (issue.vehicleAssignmentEntity?.driver1?.fullName || '').toLowerCase().includes(searchLower) ||
                (issue.staff?.fullName || '').toLowerCase().includes(searchLower)
            );
        }

        // Lọc theo khoảng thời gian
        if (filters.dateRange) {
            const [startDate, endDate] = filters.dateRange;
            filtered = filtered.filter(issue => {
                if (!issue.reportedAt) return false;
                const reportedDate = dayjs(issue.reportedAt);
                return reportedDate.isAfter(startDate.startOf('day')) && 
                       reportedDate.isBefore(endDate.endOf('day'));
            });
        }

        // Lọc theo loại sự cố
        if (filters.issueCategory !== 'all') {
            filtered = filtered.filter(issue => issue.issueCategory === filters.issueCategory);
        }

        // Lọc theo trạng thái
        if (filters.status !== 'all') {
            filtered = filtered.filter(issue => issue.status === filters.status);
        }

        // Sắp xếp
        if (sort.field && sort.order) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sort.field) {
                    case 'reportedAt':
                        aValue = a.reportedAt ? dayjs(a.reportedAt).valueOf() : 0;
                        bValue = b.reportedAt ? dayjs(b.reportedAt).valueOf() : 0;
                        break;
                    case 'trackingCode':
                        aValue = a.vehicleAssignmentEntity?.trackingCode || '';
                        bValue = b.vehicleAssignmentEntity?.trackingCode || '';
                        break;
                    case 'licensePlate':
                        aValue = a.vehicleAssignmentEntity?.vehicle?.licensePlateNumber || '';
                        bValue = b.vehicleAssignmentEntity?.vehicle?.licensePlateNumber || '';
                        break;
                    case 'driverName':
                        aValue = a.vehicleAssignmentEntity?.driver1?.fullName || '';
                        bValue = b.vehicleAssignmentEntity?.driver1?.fullName || '';
                        break;
                    default:
                        return 0;
                }

                if (sort.order === 'ascend') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });
        }

        return filtered;
    }, [issues, filters, sort]);

    // Thống kê sự cố theo trạng thái
    const getIssueStats = () => {
        const pendingIssues = issues.filter(issue => issue.status === IssueEnum.OPEN).length;
        const inProgressIssues = issues.filter(issue => issue.status === IssueEnum.IN_PROGRESS).length;
        const resolvedIssues = issues.filter(issue => issue.status === IssueEnum.RESOLVED).length;
        const overdueIssues = issues.filter(issue => issue.status === IssueEnum.PAYMENT_OVERDUE).length;

        return { pendingIssues, inProgressIssues, resolvedIssues, overdueIssues };
    };

    const stats = getIssueStats();

    // Xử lý thay đổi bộ lọc
    const handleFilterChange = (key: keyof FilterState, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Xử lý thay đổi sắp xếp
    const handleSortChange = (field: string) => {
        setSort(prev => ({
            field,
            order: prev.field === field && prev.order === 'descend' ? 'ascend' : 'descend'
        }));
    };

    // Reset bộ lọc
    const resetFilters = () => {
        setFilters({
            dateRange: null,
            issueCategory: 'all',
            status: 'all',
            searchText: ''
        });
    };

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
                        <Text className="text-gray-600 block">Quá hạn thanh toán</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-red-700">{stats.overdueIssues}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.overdueIssues} color="red" showZero>
                        <div className="bg-red-200 p-2 rounded-full">
                            <ClockCircleOutlined className="text-3xl text-red-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
        </div>
    );

    // Định nghĩa các cột cho bảng
    const columns = [
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            ellipsis: { showTitle: false },
            render: (description: string, record: Issue) => (
                <div>
                    <Tooltip title={description}>
                        <span>{description.length > 50 ? `${description.substring(0, 50)}...` : description}</span>
                    </Tooltip>
                    <div className="mt-1">
                        <Tag 
                            color={getIssueCategoryColor(record.issueCategory)} 
                            style={{ fontSize: '11px' }}
                        >
                            {getIssueCategoryLabel(record.issueCategory)}
                        </Tag>
                    </div>
                </div>
            ),
        },
        {
            title: (
                <Button 
                    type="text" 
                    size="small" 
                    onClick={() => handleSortChange('trackingCode')}
                    className="flex items-center gap-1"
                >
                    Mã chuyến xe
                    {sort.field === 'trackingCode' && (
                        sort.order === 'ascend' ? <SortAscendingOutlined /> : <SortAscendingOutlined style={{ transform: 'rotate(180deg)' }} />
                    )}
                </Button>
            ),
            key: 'trackingCode',
            width: 180,
            render: (_: any, record: Issue) => (
                <div className="flex items-center gap-2">
                    <CarOutlined className="text-blue-500" />
                    <span className="font-mono font-medium">
                        {record.vehicleAssignmentEntity?.trackingCode || 'N/A'}
                    </span>
                </div>
            ),
        },
        {
            title: (
                <Button 
                    type="text" 
                    size="small" 
                    onClick={() => handleSortChange('licensePlate')}
                    className="flex items-center gap-1"
                >
                    Biển số xe
                    {sort.field === 'licensePlate' && (
                        sort.order === 'ascend' ? <SortAscendingOutlined /> : <SortAscendingOutlined style={{ transform: 'rotate(180deg)' }} />
                    )}
                </Button>
            ),
            key: 'licensePlate',
            width: 120,
            render: (_: any, record: Issue) => (
                <span className="font-medium text-blue-700">
                    {record.vehicleAssignmentEntity?.vehicle?.licensePlateNumber || 'Không xác định'}
                </span>
            ),
        },
        {
            title: (
                <Button 
                    type="text" 
                    size="small" 
                    onClick={() => handleSortChange('driverName')}
                    className="flex items-center gap-1"
                >
                    Tài xế
                    {sort.field === 'driverName' && (
                        sort.order === 'ascend' ? <SortAscendingOutlined /> : <SortAscendingOutlined style={{ transform: 'rotate(180deg)' }} />
                    )}
                </Button>
            ),
            key: 'driverName',
            width: 160,
            render: (_: any, record: Issue) => {
                const driver = record.vehicleAssignmentEntity?.driver1;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
                        <div>
                            <div className="font-medium">{driver?.fullName || 'Không xác định'}</div>
                            {driver?.phoneNumber && (
                                <div className="text-xs text-gray-500">{driver.phoneNumber}</div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: (
                <Button 
                    type="text" 
                    size="small" 
                    onClick={() => handleSortChange('reportedAt')}
                    className="flex items-center gap-1"
                >
                    Thời gian báo cáo
                    {sort.field === 'reportedAt' && (
                        sort.order === 'ascend' ? <SortAscendingOutlined /> : <SortAscendingOutlined style={{ transform: 'rotate(180deg)' }} />
                    )}
                </Button>
            ),
            dataIndex: 'reportedAt',
            key: 'reportedAt',
            width: 150,
            render: (reportedAt: string) => (
                <div>
                    <div className="font-medium">
                        {reportedAt ? dayjs(reportedAt).format('DD/MM/YYYY') : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {reportedAt ? dayjs(reportedAt).format('HH:mm') : '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => <IssueStatusTag status={status as IssueEnum} />,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            fixed: 'right' as const,
            render: (_: any, record: Issue) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record.id)}
                            className="bg-blue-500 hover:bg-blue-600"
                            size="small"
                        />
                    </Tooltip>
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
                    <div className="flex justify-between items-center mb-4">
                        <Title level={4} className="m-0 flex items-center gap-2">
                            <FilterOutlined /> Bộ lọc & Tìm kiếm
                        </Title>
                        <Button onClick={resetFilters} size="small">
                            Reset bộ lọc
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <Search
                            placeholder="Tìm kiếm theo mã sự cố, mã chuyến xe, biển số, tài xế..."
                            value={filters.searchText}
                            onChange={(e) => handleFilterChange('searchText', e.target.value)}
                            className="w-full"
                            allowClear
                        />
                        
                        <RangePicker
                            placeholder={['Từ ngày', 'Đến ngày']}
                            value={filters.dateRange}
                            onChange={(dates) => handleFilterChange('dateRange', dates)}
                            className="w-full"
                            format="DD/MM/YYYY"
                        />

                        <Select
                            placeholder="Loại sự cố"
                            value={filters.issueCategory}
                            onChange={(value) => handleFilterChange('issueCategory', value)}
                            className="w-full"
                        >
                            <Option value="all">Tất cả loại sự cố</Option>
                            <Option value="GENERAL">Sự cố chung</Option>
                            <Option value="SEAL_REPLACEMENT">Thay thế seal</Option>
                            <Option value="ACCIDENT">Tai nạn</Option>
                            <Option value="VEHICLE_BREAKDOWN">Hỏng xe</Option>
                            <Option value="WEATHER">Thời tiết xấu</Option>
                            <Option value="CARGO_ISSUE">Vấn đề hàng hóa</Option>
                            <Option value="DAMAGE">Hàng hóa hư hại</Option>
                            <Option value="MISSING_ITEMS">Thiếu hàng</Option>
                            <Option value="WRONG_ITEMS">Giao sai hàng</Option>
                            <Option value="ORDER_REJECTION">Từ chối nhận hàng</Option>
                            <Option value="PENALTY">Vi phạm giao thông</Option>
                            <Option value="REROUTE">Tái định tuyến</Option>
                            <Option value="OFF_ROUTE_RUNAWAY">Lệch tuyến bỏ trốn</Option>
                        </Select>

                        <Select
                            placeholder="Trạng thái"
                            value={filters.status}
                            onChange={(value) => handleFilterChange('status', value)}
                            className="w-full"
                        >
                            <Option value="all">Tất cả trạng thái</Option>
                            <Option value={IssueEnum.OPEN}>Chờ xử lý</Option>
                            <Option value={IssueEnum.IN_PROGRESS}>Đang xử lý</Option>
                            <Option value={IssueEnum.RESOLVED}>Đã giải quyết</Option>
                            <Option value={IssueEnum.PAYMENT_OVERDUE}>Quá hạn thanh toán</Option>
                        </Select>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarOutlined />
                            <span>
                                {filteredAndSortedIssues.length} / {issues.length} sự cố
                            </span>
                        </div>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredAndSortedIssues}
                        rowKey="id"
                        pagination={{
                            pageSize: 15,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '15', '20', '50'],
                            showTotal: (total, range) => 
                                `Hiển thị ${range[0]}-${range[1]} của ${total} sự cố`,
                            className: 'mt-4'
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
                        scroll={{ x: 1200 }}
                        onRow={(record) => ({
                            onClick: () => handleViewDetails(record.id),
                            style: { cursor: 'pointer' }
                        })}
                        size="middle"
                    />
                </Card>
            </div>
        </div>
    );
};

export default IssueList;