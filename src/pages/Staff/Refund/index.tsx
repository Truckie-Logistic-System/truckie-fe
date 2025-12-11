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
  Empty,
  Modal,
  Image,
  Divider
} from 'antd';
import { 
  RollbackOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ShoppingOutlined,
  CarOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  BankOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import refundService, { type StaffRefundResponse } from '../../../services/refund/refundService';
import { getIssueTypeLabel } from '../../../constants/enums/IssueTypeEnum';

const { Title, Text } = Typography;

const RefundListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRefund, setSelectedRefund] = useState<StaffRefundResponse | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const { data: refunds = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staffRefunds'],
    queryFn: () => refundService.getAllRefundsForStaff(),
  });

  // Filter refunds
  const filteredRefunds = refunds.filter(r => {
    const matchSearch = searchText === '' || 
      r.issue?.id?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.vehicleAssignment?.trackingCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.order?.orderCode?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || r.issue?.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: refunds.length,
    completed: refunds.filter(r => r.issue?.status === 'RESOLVED').length,
    pending: refunds.filter(r => r.issue?.status === 'OPEN' || r.issue?.status === 'IN_PROGRESS').length,
    totalAmount: refunds.reduce((sum, r) => sum + (r.refundAmount || 0), 0),
  };

  const getIssueStatusTag = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã hoàn</Tag>;
      case 'OPEN':
      case 'IN_PROGRESS':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Chờ xử lý</Tag>;
      case 'CANCELLED':
        return <Tag icon={<CloseCircleOutlined />} color="error">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status || '-'}</Tag>;
    }
  };

  const getIssueTypeTag = (issueTypeName?: string) => {
    const label = getIssueTypeLabel(issueTypeName || '');
    switch (issueTypeName?.toUpperCase()) {
      case 'DAMAGE':
        return <Tag color="red">{label}</Tag>;
      case 'ORDER_REJECTION':
        return <Tag color="orange">{label}</Tag>;
      case 'SEAL_REPLACEMENT':
        return <Tag color="blue">{label}</Tag>;
      case 'PENALTY':
        return <Tag color="purple">{label}</Tag>;
      case 'REROUTE':
        return <Tag color="cyan">{label}</Tag>;
      case 'OFF_ROUTE_RUNAWAY':
        return <Tag color="magenta">{label}</Tag>;
      default:
        return <Tag color="default">{label}</Tag>;
    }
  };

  const handleViewDetail = async (refund: StaffRefundResponse) => {
    try {
      const detail = await refundService.getRefundDetailForStaff(refund.id);
      setSelectedRefund(detail);
      setIsDetailVisible(true);
    } catch (error) {
      console.error('Error fetching refund detail:', error);
    }
  };

  const columns: ColumnsType<StaffRefundResponse> = [
    {
      title: 'Mã sự cố',
      key: 'issueId',
      width: 120,
      render: (_, record) => (
        <Text strong className="text-blue-600 text-xs">
          {record.issue?.id?.slice(0, 8) || '-'}...
        </Text>
      )
    },
    {
      title: 'Tracking Code',
      key: 'trackingCode',
      width: 140,
      render: (_, record) => (
        <Text className="font-medium">{record.vehicleAssignment?.trackingCode || '-'}</Text>
      )
    },
    {
      title: 'Mã đơn hàng',
      key: 'orderCode',
      width: 160,
      render: (_, record) => (
        <Text>{record.order?.orderCode || '-'}</Text>
      )
    },
    {
      title: 'Loại sự cố',
      key: 'issueType',
      width: 150,
      render: (_, record) => getIssueTypeTag(record.issue?.issueTypeName)
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => getIssueStatusTag(record.issue?.status)
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="primary"
            size="small"
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
          <RollbackOutlined className="mr-2 text-blue-600" />
          Quản lý hoàn tiền
        </Title>
        <Text type="secondary">Theo dõi và xử lý các yêu cầu hoàn tiền từ sự cố</Text>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm border-t-4 border-t-blue-500">
            <Statistic title="Tổng yêu cầu" value={stats.total} prefix={<RollbackOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm border-t-4 border-t-green-500">
            <Statistic title="Đã hoàn" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm border-t-4 border-t-yellow-500">
            <Statistic title="Chờ xử lý" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm border-t-4 border-t-purple-500">
            <Statistic 
              title="Tổng tiền hoàn" 
              value={stats.totalAmount}
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
              placeholder="Tìm theo mã sự cố, tracking code, đơn hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 320 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'RESOLVED', label: 'Đã hoàn' },
                { value: 'OPEN', label: 'Chờ xử lý' },
                { value: 'IN_PROGRESS', label: 'Đang xử lý' },
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
          dataSource={filteredRefunds}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu hoàn tiền`
          }}
          locale={{ emptyText: <Empty description="Không có yêu cầu hoàn tiền nào" /> }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <RollbackOutlined className="mr-2 text-blue-600" />
            Chi tiết hoàn tiền
          </div>
        }
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedRefund && (
          <div className="space-y-4">
            {/* Quick Info Banners - 3 columns */}
            <Row gutter={[12, 12]}>
              {/* Order Banner */}
              <Col xs={24} md={8}>
                <Card 
                  size="small"
                  className="h-full border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectedRefund.order?.id && navigate(`/staff/orders/${selectedRefund.order.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingOutlined className="text-blue-500 text-lg" />
                    <Text strong>Đơn hàng</Text>
                  </div>
                  <div className="space-y-1">
                    <Text className="block text-blue-600 font-medium">
                      {selectedRefund.order?.orderCode || '-'}
                    </Text>
                    <Text type="secondary" className="text-xs block">
                      Người gửi: {selectedRefund.order?.senderName || '-'}
                    </Text>
                    <Text type="secondary" className="text-xs block">
                      Người nhận: {selectedRefund.order?.receiverName || '-'}
                    </Text>
                  </div>
                </Card>
              </Col>

              {/* Vehicle Assignment Banner */}
              <Col xs={24} md={8}>
                <Card 
                  size="small"
                  className="h-full border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectedRefund.vehicleAssignment?.id && navigate(`/staff/trips/${selectedRefund.vehicleAssignment.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CarOutlined className="text-green-500 text-lg" />
                    <Text strong>Chuyến xe</Text>
                  </div>
                  <div className="space-y-1">
                    <Text className="block text-green-600 font-medium">
                      {selectedRefund.vehicleAssignment?.trackingCode || '-'}
                    </Text>
                    <Text type="secondary" className="text-xs block">
                      Biển số: {selectedRefund.vehicleAssignment?.vehiclePlateNumber || '-'}
                    </Text>
                    <Text type="secondary" className="text-xs block">
                      Tài xế: {selectedRefund.vehicleAssignment?.driverName || '-'}
                    </Text>
                  </div>
                </Card>
              </Col>

              {/* Issue Banner */}
              <Col xs={24} md={8}>
                <Card 
                  size="small"
                  className="h-full border-l-4 border-l-orange-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectedRefund.issue?.id && navigate(`/staff/issues/${selectedRefund.issue.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationCircleOutlined className="text-orange-500 text-lg" />
                    <Text strong>Sự cố</Text>
                  </div>
                  <div className="space-y-1">
                    <div>{getIssueTypeTag(selectedRefund.issue?.issueTypeName)}</div>
                    <Text type="secondary" className="text-xs block">
                      Trạng thái: {getIssueStatusTag(selectedRefund.issue?.status)}
                    </Text>
                    <Text type="secondary" className="text-xs block truncate">
                      {selectedRefund.issue?.description || '-'}
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider className="my-3" />

            {/* Refund Details - 3 columns when image exists */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={selectedRefund.bankTransferImage ? 8 : 12}>
                <Card size="small" title={<><DollarOutlined className="mr-2" />Thông tin hoàn tiền</>}>
                  <div className="space-y-3">
                    <div>
                      <Text type="secondary" className="block text-xs">Số tiền hoàn</Text>
                      <Text strong className="text-green-600 text-lg">
                        {selectedRefund.refundAmount?.toLocaleString('vi-VN')} đ
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" className="block text-xs">Mã giao dịch</Text>
                      <Text>{selectedRefund.transactionCode || '-'}</Text>
                    </div>
                    <div>
                      <Text type="secondary" className="block text-xs">Ngày hoàn tiền</Text>
                      <Text>
                        {selectedRefund.refundDate 
                          ? dayjs(selectedRefund.refundDate).format('DD/MM/YYYY HH:mm') 
                          : '-'}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" className="block text-xs">Ngày tạo</Text>
                      <Text>{dayjs(selectedRefund.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                    </div>
                    {selectedRefund.notes && (
                      <div>
                        <Text type="secondary" className="block text-xs">Ghi chú</Text>
                        <Text>{selectedRefund.notes}</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={selectedRefund.bankTransferImage ? 8 : 12}>
                <Card size="small" title={<><BankOutlined className="mr-2" />Thông tin ngân hàng</>}>
                  <div className="space-y-3">
                    <div>
                      <Text type="secondary" className="block text-xs">Ngân hàng</Text>
                      <Text>{selectedRefund.bankName || '-'}</Text>
                    </div>
                    <div>
                      <Text type="secondary" className="block text-xs">Số tài khoản</Text>
                      <Text>{selectedRefund.accountNumber || '-'}</Text>
                    </div>
                    <div>
                      <Text type="secondary" className="block text-xs">Chủ tài khoản</Text>
                      <Text>{selectedRefund.accountHolderName || '-'}</Text>
                    </div>
                    {selectedRefund.processedByStaff && (
                      <div>
                        <Text type="secondary" className="block text-xs">Nhân viên xử lý</Text>
                        <div className="flex items-center gap-2">
                          <UserOutlined />
                          <Text>{selectedRefund.processedByStaff.fullName}</Text>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              {/* Bank Transfer Image - third column when present */}
              {selectedRefund.bankTransferImage && (
                <Col xs={24} md={8}>
                  <Card size="small" title="Ảnh chứng từ chuyển khoản">
                    <Image
                      src={selectedRefund.bankTransferImage}
                      alt="Bank transfer proof"
                      style={{ maxHeight: 200, objectFit: 'contain', width: '100%' }}
                    />
                  </Card>
                </Col>
              )}
            </Row>

            {/* Transaction Info (if any) */}
            {selectedRefund.transaction && (
              <>
                <Divider className="my-3" />
                <Card size="small" title={<><DollarOutlined className="mr-2" />Giao dịch liên quan</>}>
                  <Row gutter={[16, 8]}>
                    <Col xs={12} md={6}>
                      <Text type="secondary" className="block text-xs">Mã giao dịch</Text>
                      <Text className="text-blue-600">{selectedRefund.transaction.gatewayOrderCode || '-'}</Text>
                    </Col>
                    <Col xs={12} md={6}>
                      <Text type="secondary" className="block text-xs">Loại</Text>
                      <Text>{selectedRefund.transaction.transactionType || '-'}</Text>
                    </Col>
                    <Col xs={12} md={6}>
                      <Text type="secondary" className="block text-xs">Số tiền</Text>
                      <Text className="text-green-600">
                        {selectedRefund.transaction.amount?.toLocaleString('vi-VN')} đ
                      </Text>
                    </Col>
                    <Col xs={12} md={6}>
                      <Text type="secondary" className="block text-xs">Trạng thái</Text>
                      <Tag color={selectedRefund.transaction.status === 'SUCCESS' ? 'green' : 'orange'}>
                        {selectedRefund.transaction.status}
                      </Tag>
                    </Col>
                  </Row>
                </Card>
              </>
            )}

          </div>
        )}
      </Modal>
    </div>
  );
};

export default RefundListPage;
