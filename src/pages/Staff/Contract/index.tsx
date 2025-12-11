import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  Table, 
  Typography, 
  Tag, 
  Input, 
  Space, 
  Button, 
  Tooltip,
  Row,
  Col,
  Statistic,
  Select,
  Skeleton,
  Empty
} from 'antd';
import { 
  FileTextOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  DollarOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import contractService from '../../../services/contract/contractService';

const { Title, Text } = Typography;

interface StaffContract {
  id: string;
  contractName: string;
  status: string;
  description?: string;
  attachFileUrl?: string;
  createdAt: string;
  effectiveDate?: string;
  expirationDate?: string;
  totalValue: number;
  adjustedValue: number;
  effectiveValue: number;
  paidAmount: number;
  remainingAmount: number;
  order?: {
    id: string;
    orderCode: string;
    status: string;
    senderName?: string;
    senderPhone?: string;
    receiverName?: string;
    receiverPhone?: string;
    pickupAddress?: string;
    deliveryAddress?: string;
    createdAt?: string;
  };
  staff?: {
    id: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
  };
}

const ContractListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: contracts = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staffContractsForStaff'],
    queryFn: () => contractService.getAllContractsForStaff(),
  });

  // Sort newest first on FE as well (fallback + ensure consistency)
  const sortedContracts = [...contracts].sort((a: StaffContract, b: StaffContract) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  // Filter contracts
  const filteredContracts = sortedContracts.filter((c: StaffContract) => {
    const matchSearch = searchText === '' || 
      c.contractName?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.order?.orderCode?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: sortedContracts.length,
    active: sortedContracts.filter((c: StaffContract) => 
      c.status === 'CONTRACT_SIGNED' || c.status === 'DEPOSITED' || c.status === 'PAID'
    ).length,
    pending: sortedContracts.filter((c: StaffContract) => 
      c.status === 'CONTRACT_DRAFT' || c.status === 'UNPAID'
    ).length,
    totalValue: sortedContracts.reduce((sum: number, c: StaffContract) => sum + (c.effectiveValue || 0), 0),
  };

  // Get status tag with color and Vietnamese translation
  // Based on ContractStatusEnum: CONTRACT_DRAFT, CONTRACT_SIGNED, DEPOSITED, PAID, UNPAID, CANCELLED, EXPIRED, REFUNDED
  const getStatusTag = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONTRACT_DRAFT':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Bản nháp</Tag>;
      case 'CONTRACT_SIGNED':
        return <Tag icon={<CheckCircleOutlined />} color="processing">Đã ký</Tag>;
      case 'DEPOSITED':
        return <Tag icon={<CheckCircleOutlined />} color="cyan">Đã đặt cọc</Tag>;
      case 'PAID':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã thanh toán</Tag>;
      case 'UNPAID':
        return <Tag icon={<ExclamationCircleOutlined />} color="orange">Chưa thanh toán</Tag>;
      case 'CANCELLED':
        return <Tag icon={<CloseCircleOutlined />} color="error">Đã hủy</Tag>;
      case 'EXPIRED':
        return <Tag icon={<ExclamationCircleOutlined />} color="default">Hết hạn</Tag>;
      case 'REFUNDED':
        return <Tag icon={<StopOutlined />} color="purple">Đã hoàn tiền</Tag>;
      default:
        return <Tag color="default">{status || 'Không xác định'}</Tag>;
    }
  };

  const columns: ColumnsType<StaffContract> = [
    {
      title: 'Mã hợp đồng',
      dataIndex: 'contractName',
      key: 'contractName',
      width: 180,
      render: (name: string, record) => (
        <Button 
          type="link" 
          className="p-0 font-semibold text-left"
          style={{ whiteSpace: 'normal', textAlign: 'left' }}
          onClick={() => navigate(`/staff/contracts/${record.id}`)}
        >
          {name || `HĐ-${record.id?.substring(0, 8)}`}
        </Button>
      )
    },
    {
      title: 'Mã đơn hàng',
      key: 'orderCode',
      width: 140,
      render: (_, record) => (
        <Button 
          type="link" 
          className="p-0"
          onClick={() => record.order?.id && navigate(`/staff/orders/${record.order.id}`)}
          disabled={!record.order?.id}
        >
          {record.order?.orderCode || '-'}
        </Button>
      )
    },
    {
      title: 'Tổng giá trị',
      key: 'effectiveValue',
      width: 160,
      align: 'right',
      render: (_, record) => (
        <Text strong className="text-green-600">
          {(record.effectiveValue || 0).toLocaleString('vi-VN')} đ
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/staff/contracts/${record.id}`)}
          />
        </Tooltip>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={3} className="mb-2">
          <FileTextOutlined className="mr-2 text-blue-600" />
          Quản lý hợp đồng
        </Title>
        <Text type="secondary">Theo dõi và quản lý các hợp đồng vận chuyển</Text>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="mb-6" align="stretch">
        <Col xs={12} sm={6}>
          <Card
            className="text-center shadow-sm border-t-4 border-t-blue-500"
            style={{ height: '100%' }}
          >
            <Statistic title="Tổng hợp đồng" value={stats.total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className="text-center shadow-sm border-t-4 border-t-green-500"
            style={{ height: '100%' }}
          >
            <Statistic title="Đang hoạt động" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className="text-center shadow-sm border-t-4 border-t-yellow-500"
            style={{ height: '100%' }}
          >
            <Statistic title="Chờ xử lý" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className="text-center shadow-sm border-t-4 border-t-purple-500"
            style={{ height: '100%' }}
          >
            <Statistic 
              title="Tổng giá trị" 
              value={stats.totalValue} 
              prefix={<DollarOutlined />}
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Space wrap className="w-full justify-between">
          <Space wrap>
            <Input
              placeholder="Tìm theo mã hợp đồng, đơn hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 180 }}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'CONTRACT_DRAFT', label: 'Bản nháp' },
                { value: 'CONTRACT_SIGNED', label: 'Đã ký' },
                { value: 'DEPOSITED', label: 'Đã đặt cọc' },
                { value: 'PAID', label: 'Đã thanh toán' },
                { value: 'UNPAID', label: 'Chưa thanh toán' },
                { value: 'CANCELLED', label: 'Đã hủy' },
                { value: 'EXPIRED', label: 'Hết hạn' },
                { value: 'REFUNDED', label: 'Đã hoàn tiền' },
              ]}
            />
          </Space>
          <Button 
            icon={<ReloadOutlined spin={isFetching} />} 
            onClick={() => refetch()}
          >
            Làm mới
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredContracts}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} hợp đồng`
          }}
          locale={{ emptyText: <Empty description="Không có hợp đồng nào" /> }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default ContractListPage;
