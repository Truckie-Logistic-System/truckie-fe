import React, { useState, useMemo } from 'react';
import {
    Table,
    Button,
    Space,
    Tag,
    Input,
    Card,
    Typography,
    message,
    Popconfirm,
    DatePicker,
    Select,
    Spin,
    Result
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import penaltyService from '@/services/penalty';
import type { Penalty } from '@/models/Penalty';
import { PenaltyStatus, penaltyStatusColors } from '@/models/Penalty';
import PenaltyModal from './components/PenaltyModal';
import { useAuth } from '@/context';
import type { GetPenaltiesResponse } from '@/services/penalty/types';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PenaltyHistory: React.FC = () => {
    const [searchText, setSearchText] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [currentPenalty, setCurrentPenalty] = useState<Penalty | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
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
        queryFn: penaltyService.getPenalties,
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
                <Tag color={penaltyStatusColors[status as PenaltyStatus] || 'default'}>
                    {status}
                </Tag>
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
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewPenalty(record)}
                    />
                    <Button
                        type="text"
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
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Render loading state
    if (isLoading) {
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
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <Title level={3}>Lịch sử vi phạm</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddPenalty}
                    >
                        Thêm vi phạm mới
                    </Button>
                </div>

                <div className="mb-4">
                    <Input
                        placeholder="Tìm kiếm vi phạm..."
                        prefix={<SearchOutlined />}
                        onChange={e => debouncedSearch(e.target.value)}
                        className="w-full md:w-80"
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredPenalties}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng cộng ${total} vi phạm`,
                    }}
                />
            </Card>

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