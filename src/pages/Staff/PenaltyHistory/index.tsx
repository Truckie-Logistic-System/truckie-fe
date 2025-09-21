import React, { useState, useMemo } from 'react';
import {
    Table,
    Button,
    Space,
    Input,
    Card,
    Typography,
    message,
    Popconfirm,
    Select,
    Spin,
    Result,
    Skeleton,
    Badge
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ReloadOutlined,
    WarningOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import penaltyService from '@/services/penalty';
import type { Penalty } from '@/models/Penalty';
import { PenaltyStatus } from '@/models/Penalty';
import { PenaltyStatusEnum } from '@/constants/enums';
import { PenaltyStatusTag } from '@/components/common/tags';
import PenaltyModal from './components/PenaltyModal';
import { useAuth } from '@/context';
import type { GetPenaltiesResponse } from '@/services/penalty/types';
import { DateSelectGroup } from '@/components/common';

const { Title, Text } = Typography;
const { Option } = Select;

const PenaltyHistory: React.FC = () => {
    const [searchText, setSearchText] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [currentPenalty, setCurrentPenalty] = useState<Penalty | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

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

    // Mutations
    const createMutation = useMutation({
        mutationFn: penaltyService.createPenalty,
        onSuccess: () => {
            message.success('Tạo vi phạm mới thành công');
            setIsModalVisible(false);
            queryClient.invalidateQueries({ queryKey: ['penalties'] });
        },
        onError: (err: Error) => {
            message.error(err.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            penaltyService.updatePenalty(id, data),
        onSuccess: () => {
            message.success('Cập nhật vi phạm thành công');
            setIsModalVisible(false);
            queryClient.invalidateQueries({ queryKey: ['penalties'] });
        },
        onError: (err: Error) => {
            message.error(err.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: penaltyService.deletePenalty,
        onSuccess: () => {
            message.success('Xóa vi phạm thành công');
            queryClient.invalidateQueries({ queryKey: ['penalties'] });
        },
        onError: (err: Error) => {
            message.error(err.message);
        }
    });

    // Debounce search
    const debouncedSearch = useMemo(
        () => debounce((value: string) => {
            setSearchText(value);
        }, 500),
        []
    );

    const handleAddPenalty = () => {
        setCurrentPenalty(null);
        setModalMode('create');
        setIsModalVisible(true);
    };

    const handleEditPenalty = (record: Penalty) => {
        setCurrentPenalty(record);
        setModalMode('edit');
        setIsModalVisible(true);
    };

    const handleViewPenalty = (record: Penalty) => {
        setCurrentPenalty(record);
        setModalMode('view');
        setIsModalVisible(true);
    };

    const handleDeletePenalty = async (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleModalSubmit = async (values: any, mode: 'create' | 'edit') => {
        if (mode === 'create') {
            createMutation.mutate(values);
        } else if (mode === 'edit' && currentPenalty) {
            updateMutation.mutate({ id: currentPenalty.id, data: values });
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    // Filter penalties based on search text
    const filteredPenalties = useMemo(() => {
        if (!penaltiesResponse?.data) return [];

        return penaltiesResponse.data.filter((penalty: Penalty) =>
            penalty.violationType.toLowerCase().includes(searchText.toLowerCase()) ||
            penalty.violationDescription.toLowerCase().includes(searchText.toLowerCase()) ||
            penalty.location.toLowerCase().includes(searchText.toLowerCase()) ||
            penalty.status.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [penaltiesResponse?.data, searchText]);

    // Thống kê vi phạm theo trạng thái
    const getPenaltyStats = () => {
        if (!penaltiesResponse?.data) return {
            pendingCount: 0,
            paidCount: 0,
            disputedCount: 0,
            totalAmount: 0
        };

        const penalties = penaltiesResponse.data;

        const pendingCount = penalties.filter(p => p.status === PenaltyStatus.PENDING).length;
        const paidCount = penalties.filter(p => p.status === PenaltyStatus.PAID).length;
        const disputedCount = penalties.filter(p => p.status === PenaltyStatus.DISPUTED).length;

        const totalAmount = penalties.reduce((sum, penalty) => sum + penalty.penaltyAmount, 0);

        return { pendingCount, paidCount, disputedCount, totalAmount };
    };

    const stats = getPenaltyStats();

    // Render stats card theo layout của Admin
    const renderStatCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Chờ thanh toán</Text>
                        {isLoading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-orange-800">{stats.pendingCount}</Title>
                        )}
                    </div>
                    <Badge count={isLoading ? 0 : stats.pendingCount} color="orange" showZero>
                        <div className="bg-orange-200 p-2 rounded-full">
                            <ExclamationCircleOutlined className="text-3xl text-orange-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đang khiếu nại</Text>
                        {isLoading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-blue-800">{stats.disputedCount}</Title>
                        )}
                    </div>
                    <Badge count={isLoading ? 0 : stats.disputedCount} color="blue" showZero>
                        <div className="bg-blue-200 p-2 rounded-full">
                            <WarningOutlined className="text-3xl text-blue-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đã thanh toán</Text>
                        {isLoading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-green-700">{stats.paidCount}</Title>
                        )}
                    </div>
                    <Badge count={isLoading ? 0 : stats.paidCount} color="green" showZero>
                        <div className="bg-green-200 p-2 rounded-full">
                            <CheckCircleOutlined className="text-3xl text-green-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Tổng tiền phạt</Text>
                        {isLoading ? (
                            <Skeleton.Input style={{ width: 120 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-purple-700">{stats.totalAmount.toLocaleString()} VND</Title>
                        )}
                    </div>
                    <div className="bg-purple-200 p-2 rounded-full">
                        <DollarOutlined className="text-3xl text-purple-600" />
                    </div>
                </div>
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
            title: 'Mô tả',
            dataIndex: 'violationDescription',
            key: 'violationDescription',
            ellipsis: true,
        },
        {
            title: 'Số tiền phạt',
            dataIndex: 'penaltyAmount',
            key: 'penaltyAmount',
            render: (amount: number) => `${amount.toLocaleString()} VND`,
            sorter: (a: Penalty, b: Penalty) => a.penaltyAmount - b.penaltyAmount,
        },
        {
            title: 'Ngày vi phạm',
            dataIndex: 'penaltyDate',
            key: 'penaltyDate',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
            sorter: (a: Penalty, b: Penalty) => dayjs(a.penaltyDate).unix() - dayjs(b.penaltyDate).unix(),
        },
        {
            title: 'Địa điểm',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <PenaltyStatusTag status={status as PenaltyStatusEnum} />
            ),
            filters: Object.values(PenaltyStatus).map(status => ({
                text: status,
                value: status,
            })),
            onFilter: (value: any, record: Penalty) => record.status === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Penalty) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewPenalty(record)}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        Chi tiết
                    </Button>
                    <Button
                        type="default"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditPenalty(record)}
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa vi phạm này?"
                        onConfirm={() => handleDeletePenalty(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button
                            type="default"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Render loading state
    if (isLoading && !penaltiesResponse) {
        return (
            <div className="p-6 flex justify-center items-center h-64">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

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
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <WarningOutlined className="mr-3 text-blue-600" /> Lịch sử vi phạm
                        </Title>
                        <Text type="secondary">Quản lý thông tin các vi phạm và khoản phạt trong hệ thống</Text>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddPenalty}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="large"
                        >
                            Thêm vi phạm mới
                        </Button>
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
                </div>

                {renderStatCards()}

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">Danh sách vi phạm</Title>
                        <div className="flex w-full md:w-auto">
                            <Input
                                placeholder="Tìm kiếm vi phạm..."
                                prefix={<SearchOutlined />}
                                onChange={e => debouncedSearch(e.target.value)}
                                className="w-full md:w-80"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredPenalties}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showTotal: (total) => `Tổng ${total} khoản phạt`
                        }}
                        loading={{
                            spinning: isLoading,
                            indicator: <></>
                        }}
                        className="penalty-table"
                        rowClassName="hover:bg-blue-50 transition-colors"
                        locale={{
                            emptyText: isLoading ? (
                                <div className="py-5">
                                    <Skeleton active paragraph={{ rows: 5 }} />
                                </div>
                            ) : 'Không có dữ liệu'
                        }}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            </div>

            <PenaltyModal
                visible={isModalVisible}
                onCancel={handleModalCancel}
                onSubmit={handleModalSubmit}
                penalty={currentPenalty}
                mode={modalMode}
            />
        </div>
    );
};

export default PenaltyHistory; 