import React, { useState, useMemo } from 'react';
import {
    Table,
    Button,
    Input,
    Card,
    Typography,
    Result,
    Skeleton,
    Badge,
    Statistic,
    Segmented,
    Space,
    App,
    ConfigProvider,
    theme
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import penaltyService from '@/services/penalty';
import type { Penalty } from '@/models/Penalty';
import PenaltyModal from './components/PenaltyModal';
import { useAuth } from '@/context';
import type { GetPenaltiesResponse } from '@/services/penalty/types';

const { Title, Text } = Typography;

const PenaltyHistory: React.FC = () => {
    const { token } = theme.useToken();
    const [searchText, setSearchText] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [currentPenalty, setCurrentPenalty] = useState<Penalty | null>(null);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const { isAuthenticated } = useAuth();

    // Sử dụng React Query để fetch penalties
    const {
        data: penaltiesResponse,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery<GetPenaltiesResponse, Error>({
        queryKey: ['penalties'],
        queryFn: () => {
            setIsFetching(true);
            return penaltyService.getPenalties().finally(() => setIsFetching(false));
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 phút
    });

    // Debounce search
    const debouncedSearch = useMemo(
        () => debounce((value: string) => {
            setSearchText(value);
        }, 500),
        []
    );

    const handleViewPenalty = (record: Penalty) => {
        setCurrentPenalty(record);
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    // Filter penalties based on search text and status
    const filteredPenalties = useMemo(() => {
        if (!penaltiesResponse?.data) return [];

        let penalties = penaltiesResponse.data;
        
        // Apply status filter
        if (statusFilter !== 'all') {
            penalties = penalties.filter((penalty: Penalty) => {
                // Add status filtering logic when penalty has status field
                return true; // Placeholder - update when status field is available
            });
        }

        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return penalties;

        return penalties.filter((penalty: Penalty) => {
            const violation = penalty.violationType?.toLowerCase() ?? '';
            const username = penalty.driverSummary?.username?.toLowerCase() ?? '';
            const fullName = penalty.driverSummary?.fullName?.toLowerCase() ?? '';
            const phone = penalty.driverSummary?.phoneNumber?.toLowerCase() ?? '';

            return (
                violation.includes(keyword) ||
                username.includes(keyword) ||
                fullName.includes(keyword) ||
                phone.includes(keyword)
            );
        });
    }, [penaltiesResponse?.data, searchText, statusFilter]);

    // Thống kê vi phạm theo trạng thái
    const getPenaltyStats = () => {
        if (!penaltiesResponse?.data) return {
            totalCount: 0
        };

        const penalties = penaltiesResponse.data;
        const totalCount = penalties.length;

        return { totalCount };
    };

    const stats = getPenaltyStats();

    // Render stats card với Statistic component
    const renderStatCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <Statistic
                    title="Tổng số vi phạm"
                    value={stats.totalCount}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: token.colorPrimary }}
                    loading={isLoading}
                />
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <Statistic
                    title="Vi phạm trong tháng"
                    value={penaltiesResponse?.data?.filter(p => 
                        dayjs(p.penaltyDate).isSame(dayjs(), 'month')
                    ).length || 0}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: token.colorWarning }}
                    loading={isLoading}
                />
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <Statistic
                    title="Vi phạm trong tuần"
                    value={penaltiesResponse?.data?.filter(p => 
                        dayjs(p.penaltyDate).isSame(dayjs(), 'week')
                    ).length || 0}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: token.colorError }}
                    loading={isLoading}
                />
            </Card>
        </div>
    );

    const columns = [
        {
            title: 'Loại vi phạm',
            dataIndex: 'violationType',
            key: 'violationType',
            sorter: (a: Penalty, b: Penalty) => a.violationType.localeCompare(b.violationType),
        },
        {
            title: 'Ngày vi phạm',
            dataIndex: 'penaltyDate',
            key: 'penaltyDate',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
            sorter: (a: Penalty, b: Penalty) => dayjs(a.penaltyDate).unix() - dayjs(b.penaltyDate).unix(),
        },
        {
            title: 'ID Tài xế',
            dataIndex: 'driverId',
            key: 'driverId',
        },
        {
            title: 'ID Phân công xe',
            dataIndex: 'vehicleAssignmentId',
            key: 'vehicleAssignmentId',
        },
    ];

    // Render error state
    if (isError) {
        return (
            <div className="p-6">
                <Result
                    status="error"
                    title="Không thể tải dữ liệu"
                    subTitle={(error as Error)?.message || 'Đã xảy ra lỗi khi tải danh sách vi phạm'}
                    extra={
                        <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetch()}>
                            Thử lại
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: token.colorPrimary,
                    borderRadius: 8,
                    wireframe: false
                },
                components: {
                    Table: {
                        headerBg: '#fafafa',
                        headerColor: token.colorText,
                        rowHoverBg: token.colorPrimaryBg
                    },
                    Card: {
                        borderRadius: 12
                    }
                }
            }}
        >
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                        <div className="flex-1">
                            <Title level={2} className="flex items-center m-0 text-blue-800">
                                <WarningOutlined className="mr-3 text-blue-600" /> Lịch sử vi phạm
                            </Title>
                            <Text type="secondary">Quản lý thông tin các vi phạm và khoản phạt trong hệ thống</Text>
                        </div>
                        <Button
                            type="default"
                            icon={<ReloadOutlined spin={isFetching} />}
                            onClick={() => refetch()}
                            size="large"
                            loading={isFetching}
                        >
                            Làm mới
                        </Button>
                    </div>

                    {renderStatCards()}

                    <Card className="shadow-sm mb-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                            <div className="flex-1">
                                <Title level={4} className="m-0">Danh sách vi phạm</Title>
                                <Text type="secondary" className="text-sm">
                                    Hiển thị {filteredPenalties.length} trên {penaltiesResponse?.data?.length || 0} vi phạm
                                </Text>
                            </div>
                            <Space.Compact className="w-full lg:w-auto">
                                <Segmented
                                    options={[
                                        { label: 'Tất cả', value: 'all' },
                                        { label: 'Nghiêm trọng', value: 'serious' },
                                        { label: 'Thông thường', value: 'normal' }
                                    ]}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    className="mb-0"
                                />
                                <Input
                                    placeholder="Tìm kiếm theo loại vi phạm, tài xế, mã chuyến..."
                                    prefix={<SearchOutlined />}
                                    onChange={e => debouncedSearch(e.target.value)}
                                    className="flex-1 min-w-[300px]"
                                    disabled={isLoading}
                                />
                            </Space.Compact>
                        </div>

                        <Table
                            columns={columns}
                            dataSource={filteredPenalties}
                            rowKey="id"
                            onRow={(record) => ({
                                onClick: () => handleViewPenalty(record),
                                style: { cursor: 'pointer' }
                            })}
                            pagination={{
                                pageSize: 15,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '15', '20', '50'],
                                showTotal: (total, range) => 
                                    `Hiển thị ${range[0]}-${range[1]} trên ${total} khoản phạt`,
                                showQuickJumper: true,
                                size: 'default'
                            }}
                            loading={{
                                spinning: isLoading,
                                indicator: <Skeleton active paragraph={{ rows: 8 }} />
                            }}
                            className="penalty-table"
                            rowClassName={(record, index) => 
                                index % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50 transition-colors' : 'hover:bg-blue-50 transition-colors'
                            }
                            locale={{
                                emptyText: isLoading ? (
                                    <div className="py-8">
                                        <Skeleton active paragraph={{ rows: 8 }} />
                                    </div>
                                ) : 'Không có dữ liệu vi phạm'
                            }}
                            scroll={{ 
                                x: 'max-content',
                                y: 'calc(100vh - 400px)'
                            }}
                            sticky={{
                                offsetHeader: 0
                            }}
                            size="middle"
                            summary={() => 
                                filteredPenalties.length > 0 ? (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={3}>
                                            <Text strong>Tổng cộng</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={3}>
                                            <Text strong>{filteredPenalties.length} vi phạm</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                ) : null
                            }
                        />
                    </Card>
                </div>

                <PenaltyModal
                    visible={isModalVisible}
                    onCancel={handleModalCancel}
                    penalty={currentPenalty}
                />
            </div>
        </ConfigProvider>
    );
};

export default PenaltyHistory;