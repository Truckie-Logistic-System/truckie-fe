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
  DatePicker,
  Select,
  Skeleton,
  Empty,
  Modal,
  Descriptions,
  Divider
} from 'antd';
import { 
  DollarOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import transactionService, { type StaffTransactionResponse } from '../../../services/transaction/transactionService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TransactionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<StaffTransactionResponse | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const getContractDisplayValue = (contract?: StaffTransactionResponse['contract']) => {
    if (!contract) return undefined;
    const adjusted = contract.adjustedValue ?? 0;
    const total = contract.totalValue ?? 0;
    const value = adjusted > 0 ? adjusted : total;
    return value > 0 ? value : undefined;
  };

  const { data: transactions = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staffTransactions'],
    queryFn: () => transactionService.getAllTransactionsForStaff(),
  });

  // Sort transactions by createdAt DESC (newest first) - backend already does this
  const sortedTransactions = [...transactions].sort((a, b) => 
    dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  );

  // Filter transactions
  const filteredTransactions = sortedTransactions.filter(t => {
    const matchSearch = searchText === '' || 
      t.gatewayOrderCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      t.contract?.contractName?.toLowerCase().includes(searchText.toLowerCase()) ||
      t.contract?.orderCode?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    
    const matchDate = !dateRange || !dateRange[0] || !dateRange[1] ||
      (dayjs(t.createdAt).isAfter(dateRange[0]) && dayjs(t.createdAt).isBefore(dateRange[1]));

    return matchSearch && matchStatus && matchDate;
  });

  // Stats
  const stats = {
    total: sortedTransactions.length,
    completed: sortedTransactions.filter(t => t.status === 'SUCCESS' || t.status === 'PAID').length,
    pending: sortedTransactions.filter(t => t.status === 'PENDING').length,
    failed: sortedTransactions.filter(t => t.status === 'FAILED' || t.status === 'CANCELLED').length,
  };

  const getStatusTag = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
        return <Tag icon={<CheckCircleOutlined />} color="success">Thành công</Tag>;
      case 'PENDING':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Chờ xử lý</Tag>;
      case 'FAILED':
      case 'CANCELLED':
        return <Tag icon={<CloseCircleOutlined />} color="error">Thất bại</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getTypeTag = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'DEPOSIT':
        return <Tag color="blue">Đặt cọc</Tag>;
      case 'FULL_PAYMENT':
        return <Tag color="green">Thanh toán đủ</Tag>;
      case 'RETURN_SHIPPING':
        return <Tag color="orange">Cước trả hàng</Tag>;
      default:
        return <Tag>{type}</Tag>;
    }
  };

  const getContractStatusTag = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONTRACT_SIGNED':
        return <Tag color="green">Đã ký</Tag>;
      case 'PAID':
        return <Tag color="blue">Đã thanh toán</Tag>;
      case 'DEPOSITED':
        return <Tag color="orange">Đã đặt cọc</Tag>;
      case 'CONTRACT_DRAFT':
        return <Tag color="default">Bản nháp</Tag>;
      case 'CANCELLED':
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handleViewDetail = async (transaction: StaffTransactionResponse) => {
    try {
      const detail = await transactionService.getTransactionDetailForStaff(transaction.id);
      setSelectedTransaction(detail);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
    }
  };

  const columns: ColumnsType<StaffTransactionResponse> = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'gatewayOrderCode',
      key: 'gatewayOrderCode',
      width: 150,
      render: (code: string) => <Text strong className="text-blue-600">{code || '-'}</Text>
    },
    {
      title: 'Hợp đồng',
      key: 'contract',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.contract?.contractName || '-'}</Text>
          {record.contract?.orderCode && (
            <div>
              <Text type="secondary" className="text-xs">
                Đơn: {record.contract.orderCode}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 120,
      render: (type: string) => getTypeTag(type)
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <Text strong className="text-green-600">
          {amount?.toLocaleString('vi-VN')} đ
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
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
          <DollarOutlined className="mr-2 text-blue-600" />
          Quản lý giao dịch
        </Title>
        <Text type="secondary">Theo dõi và quản lý các giao dịch thanh toán</Text>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm border-t-4 border-t-blue-500">
            <Statistic title="Tổng giao dịch" value={stats.total} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm border-t-4 border-t-green-500">
            <Statistic title="Thành công" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm border-t-4 border-t-yellow-500">
            <Statistic title="Chờ xử lý" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm border-t-4 border-t-red-500">
            <Statistic title="Thất bại" value={stats.failed} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Space wrap className="w-full justify-between">
          <Space wrap>
            <Input
              placeholder="Tìm theo mã giao dịch, hợp đồng, đơn hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'SUCCESS', label: 'Thành công' },
                { value: 'PENDING', label: 'Chờ xử lý' },
                { value: 'FAILED', label: 'Thất bại' },
              ]}
            />
            <RangePicker
              onChange={(dates) => setDateRange(dates)}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
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
          dataSource={filteredTransactions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} giao dịch`
          }}
          locale={{ emptyText: <Empty description="Không có giao dịch nào" /> }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Transaction Detail Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <DollarOutlined className="mr-2 text-blue-600" />
            Chi tiết giao dịch
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTransaction && (
          <div>
            {/* Contract Info Banner */}
            {selectedTransaction.contract && (
              <Card 
                className="mb-4 border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  // Navigate to contract detail using React Router
                  navigate(`/staff/contracts/${selectedTransaction.contract?.id}`);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Title level={5} className="mb-1 text-blue-600">
                      <FileTextOutlined className="mr-2" />
                      {selectedTransaction.contract.contractName}
                    </Title>
                    <Space wrap>
                      <Text type="secondary">Mã hợp đồng: {selectedTransaction.contract.id}</Text>
                      <Text type="secondary">|</Text>
                      <Text type="secondary">Đơn hàng: {selectedTransaction.contract.orderCode || '-'}</Text>
                      <Text type="secondary">|</Text>
                      <Text type="secondary">Khách hàng: {selectedTransaction.contract.customerName || '-'}</Text>
                    </Space>
                  </div>
                  <div className="text-right">
                    {getContractStatusTag(selectedTransaction.contract.status)}
                    <div className="mt-1">
                      <Text strong className="text-green-600">
                        {getContractDisplayValue(selectedTransaction.contract)?.toLocaleString('vi-VN')} đ
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Divider />

            {/* Transaction Details - new layout */}
            <Card size="small" className="border-none shadow-none p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <Text type="secondary" className="block text-xs mb-1">Mã giao dịch</Text>
                    <Text strong className="text-blue-600 break-all">
                      {selectedTransaction.gatewayOrderCode || '-'}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary" className="block text-xs mb-1">Loại giao dịch</Text>
                    {getTypeTag(selectedTransaction.transactionType)}
                  </div>
                  <div>
                    <Text type="secondary" className="block text-xs mb-1">Số tiền</Text>
                    <Text strong className="text-green-600">
                      {selectedTransaction.amount?.toLocaleString('vi-VN')} đ
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary" className="block text-xs mb-1">Tiền tệ</Text>
                    <Text>{selectedTransaction.currencyCode || 'VND'}</Text>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Text type="secondary" className="block text-xs mb-1">Trạng thái</Text>
                    {getStatusTag(selectedTransaction.status)}
                  </div>
                  <div>
                    <Text type="secondary" className="block text-xs mb-1">Ngân hàng</Text>
                    <Text>{selectedTransaction.paymentProvider || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary" className="block text-xs mb-1">Ngày tạo</Text>
                    <Text>{dayjs(selectedTransaction.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                  </div>
                  <div>
                    <Text type="secondary" className="block text-xs mb-1">Ngày thanh toán</Text>
                    <Text>
                      {selectedTransaction.paymentDate
                        ? dayjs(selectedTransaction.paymentDate).format('DD/MM/YYYY HH:mm')
                        : '-'}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Gateway Response */}
            {selectedTransaction.gatewayResponse && (
              <div className="mt-4">
                <Title level={5}>Phản hồi từ cổng thanh toán</Title>
                <Card size="small">
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedTransaction.gatewayResponse), null, 2);
                      } catch (error) {
                        return selectedTransaction.gatewayResponse;
                      }
                    })()}
                  </pre>
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionListPage;
