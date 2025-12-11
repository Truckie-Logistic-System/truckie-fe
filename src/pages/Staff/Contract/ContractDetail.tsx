import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Descriptions,
  Tabs,
  Table,
  Row,
  Col,
  Statistic,
  Skeleton,
  Empty,
  Divider,
  Space,
  Tooltip
} from 'antd';
import { 
  FileTextOutlined, 
  ArrowLeftOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  FilePdfOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  RightOutlined,
  DownloadOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import contractService from '../../../services/contract/contractService';

const { Title, Text } = Typography;

interface TransactionInfo {
  id: string;
  transactionType: string;
  amount: number;
  status: string;
  paymentProvider?: string;
  currencyCode?: string;
  paymentDate?: string;
  createdAt: string;
}

interface StaffContractDetail {
  id: string;
  contractName: string;
  status: string;
  description?: string;
  attachFileUrl?: string;
  createdAt: string;
  effectiveDate?: string;
  expirationDate?: string;
  signingDeadline?: string;
  depositPaymentDeadline?: string;
  fullPaymentDeadline?: string;
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
  transactions?: TransactionInfo[];
}

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: contract, isLoading, isError } = useQuery<StaffContractDetail>({
    queryKey: ['staffContractDetail', id],
    queryFn: () => contractService.getContractDetailForStaff(id!),
    enabled: !!id,
  });

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

  // Get transaction type tag
  const getTransactionTypeTag = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'DEPOSIT': return <Tag color="blue">Đặt cọc</Tag>;
      case 'FULL_PAYMENT': return <Tag color="green">Thanh toán đủ</Tag>;
      case 'RETURN_SHIPPING': return <Tag color="orange">Cước trả hàng</Tag>;
      default: return <Tag>{type || 'Khác'}</Tag>;
    }
  };

  // Get transaction status tag
  const getTransactionStatusTag = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
        return <Tag color="success">Thành công</Tag>;
      case 'PENDING':
        return <Tag color="warning">Chờ xử lý</Tag>;
      case 'FAILED':
        return <Tag color="error">Thất bại</Tag>;
      case 'CANCELLED':
        return <Tag color="default">Đã hủy</Tag>;
      default:
        return <Tag>{status || 'Không xác định'}</Tag>;
    }
  };

  const transactionColumns: ColumnsType<TransactionInfo> = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id: string) => (
        <Text strong className="text-blue-600">
          {id?.substring(0, 8)}...
        </Text>
      )
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 140,
      render: (type: string) => getTransactionTypeTag(type)
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'paymentProvider',
      key: 'paymentProvider',
      width: 120,
      render: (provider: string) => (
        <Text>{provider || '-'}</Text>
      )
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <Text strong className="text-green-600">
          {(amount || 0).toLocaleString('vi-VN')} đ
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getTransactionStatusTag(status)
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="p-6">
        <Empty description="Không tìm thấy hợp đồng" />
        <div className="text-center mt-4">
          <Button onClick={() => navigate('/staff/contracts')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <FileTextOutlined className="mr-1" />
          Tổng quan
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* Contract Info */}
          <Card title="Thông tin hợp đồng" className="shadow-sm">
            <Row gutter={[24, 16]}>
              {/* Left: basic info */}
              <Col xs={24} md={14}>
                <Space direction="vertical" size={8} className="w-full">
                  <div>
                    <Text type="secondary" className="text-xs block mb-1">Tên hợp đồng</Text>
                    <Text strong className="text-base">
                      {contract.contractName || '-'}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs block mb-1">Trạng thái</Text>
                    {getStatusTag(contract.status)}
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs block mb-1">Mô tả</Text>
                    <Text>
                      {contract.description || 'Không có mô tả'}
                    </Text>
                  </div>
                </Space>
              </Col>

              {/* Right: all important dates & deadlines */}
              <Col xs={24} md={10}>
                <Space direction="vertical" size={6} className="w-full text-sm">
                  <div className="flex justify-between gap-4">
                    <Text type="secondary">Ngày tạo</Text>
                    <Text strong>
                      {contract.createdAt ? dayjs(contract.createdAt).format('DD/MM/YYYY HH:mm') : '-'}
                    </Text>
                  </div>
                  <div className="flex justify-between gap-4">
                    <Text type="secondary">Ngày hiệu lực</Text>
                    <Text strong>
                      {contract.effectiveDate ? dayjs(contract.effectiveDate).format('DD/MM/YYYY') : '-'}
                    </Text>
                  </div>
                  <div className="flex justify-between gap-4">
                    <Text type="secondary">Ngày hết hạn</Text>
                    <Text strong>
                      {contract.expirationDate ? dayjs(contract.expirationDate).format('DD/MM/YYYY') : '-'}
                    </Text>
                  </div>
                  <div className="flex justify-between gap-4">
                    <Text type="secondary">Hạn ký hợp đồng</Text>
                    <Text strong>
                      {contract.signingDeadline ? dayjs(contract.signingDeadline).format('DD/MM/YYYY HH:mm') : '-'}
                    </Text>
                  </div>
                  <div className="flex justify-between gap-4">
                    <Text type="secondary">Hạn đặt cọc</Text>
                    <Text strong>
                      {contract.depositPaymentDeadline ? dayjs(contract.depositPaymentDeadline).format('DD/MM/YYYY HH:mm') : '-'}
                    </Text>
                  </div>
                  <div className="flex justify-between gap-4">
                    <Text type="secondary">Hạn thanh toán đủ</Text>
                    <Text strong>
                      {contract.fullPaymentDeadline ? dayjs(contract.fullPaymentDeadline).format('DD/MM/YYYY HH:mm') : '-'}
                    </Text>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Staff Info */}
          {contract.staff && (
            <Card 
              title={
                <span>
                  <UserOutlined className="mr-2" />
                  Nhân viên phụ trách
                </span>
              } 
              className="shadow-sm"
            >
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Họ tên">
                  <Text>{contract.staff.fullName || '-'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <Text>{contract.staff.email || '-'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <Text>{contract.staff.phoneNumber || '-'}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Payment Summary */}
          <Card title="Tình hình thanh toán" className="shadow-sm">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Statistic
                  title="Tổng giá trị hợp đồng"
                  value={contract.effectiveValue || 0}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="Đã thanh toán"
                  value={contract.paidAmount || 0}
                  valueStyle={{ color: '#52c41a' }}
                  formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="Còn lại"
                  value={contract.remainingAmount || 0}
                  valueStyle={{ color: (contract.remainingAmount || 0) > 0 ? '#faad14' : '#52c41a' }}
                  formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`}
                />
              </Col>
            </Row>
            {contract.adjustedValue && contract.adjustedValue > 0 && (
              <>
                <Divider />
                <div className="text-sm text-gray-500">
                  <Text type="secondary">
                    Giá trị gốc: {(contract.totalValue || 0).toLocaleString('vi-VN')} đ | 
                    Giá trị điều chỉnh: {contract.adjustedValue.toLocaleString('vi-VN')} đ
                  </Text>
                </div>
              </>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'transactions',
      label: (
        <span>
          <DollarOutlined className="mr-1" />
          Giao dịch ({contract.transactions?.length || 0})
        </span>
      ),
      children: (
        <Card className="shadow-sm">
          <Table
            columns={transactionColumns}
            dataSource={contract.transactions || []}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1000 }}
            locale={{ emptyText: <Empty description="Chưa có giao dịch nào" /> }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header with Back button, Title, Status and Attachment button */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/staff/contracts')}
          >
            Quay lại
          </Button>
          <div>
            <Title level={3} className="mb-0">
              <FileTextOutlined className="mr-2 text-blue-600" />
              {contract.contractName || 'Chi tiết hợp đồng'}
            </Title>
            <Space className="mt-1">
              {getStatusTag(contract.status)}
            </Space>
          </div>
        </div>
        
        {/* Attachment download button at top right */}
        {contract.attachFileUrl && contract.attachFileUrl !== 'N/A' && (
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = contract.attachFileUrl!;
              link.download = `hop-dong-${contract.contractName || contract.id}.pdf`;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Tải file đính kèm
          </Button>
        )}
      </div>

      {/* Order Quick View Card */}
      {contract.order && (
        <Card 
          className="mb-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
          onClick={() => navigate(`/staff/orders/${contract.order?.id}`)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingOutlined className="text-2xl text-blue-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">Đơn hàng liên quan</Text>
                <div className="text-lg font-bold text-blue-600">{contract.order.orderCode}</div>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  {contract.order.senderName && (
                    <span>
                      <UserOutlined className="mr-1" />
                      {contract.order.senderName}
                    </span>
                  )}
                  {contract.order.senderPhone && (
                    <span>
                      <PhoneOutlined className="mr-1" />
                      {contract.order.senderPhone}
                    </span>
                  )}
                  {contract.order.pickupAddress && (
                    <Tooltip title={contract.order.pickupAddress}>
                      <span className="max-w-xs truncate">
                        <EnvironmentOutlined className="mr-1" />
                        {contract.order.pickupAddress.substring(0, 40)}...
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
            <div className="text-gray-400">
              <RightOutlined />
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultActiveKey="overview" items={tabItems} />
    </div>
  );
};

export default ContractDetailPage;
