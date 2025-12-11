import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Button, 
  Space, 
  Tag, 
  message, 
  Skeleton,
  Typography,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import compensationAssessmentService from '@/services/issue/compensationAssessmentService';
import type { CompensationAssessment } from '@/services/issue/compensationAssessmentService';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Issue Type translations
const ISSUE_TYPE_LABELS: Record<string, string> = {
  DAMAGE: 'Hư hỏng hàng hóa',
  OFF_ROUTE: 'Lệch tuyến',
  OFF_ROUTE_RUNAWAY: 'Lệch tuyến bỏ trốn',
  SEAL_REPLACEMENT: 'Thay thế seal',
  ORDER_REJECTION: 'Từ chối đơn hàng',
  REROUTE: 'Tái định tuyến',
  PENALTY: 'Vi phạm',
};

const getIssueTypeLabel = (type?: string) => ISSUE_TYPE_LABELS[type || ''] || type || '-';

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(value);
};

const formatPercent = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `${(value * 100).toFixed(1)}%`;
};

const getIssueStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    OPEN: 'orange',
    IN_PROGRESS: 'blue',
    RESOLVED: 'green',
    CLOSED_FRAUD: 'red',
  };
  return colors[status || ''] || 'default';
};

const getIssueStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    OPEN: 'Mở',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã giải quyết',
    CLOSED_FRAUD: 'Gian lận',
  };
  return labels[status || ''] || status || '-';
};

const CompensationAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<CompensationAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const data = await compensationAssessmentService.getAllCompensationAssessments();
      setAssessments(data);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách thẩm định bồi thường');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchText(value), 300),
    []
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const filteredData = useMemo(() => {
    if (!searchText) return assessments;
    const lowerSearch = searchText.toLowerCase();
    return assessments.filter(item => 
      item.issueType?.toLowerCase().includes(lowerSearch) ||
      getIssueTypeLabel(item.issueType).toLowerCase().includes(lowerSearch) ||
      item.issue?.issueTypeName?.toLowerCase().includes(lowerSearch) ||
      item.issue?.description?.toLowerCase().includes(lowerSearch) ||
      item.createdByStaff?.fullName?.toLowerCase().includes(lowerSearch)
    );
  }, [assessments, searchText]);

  // Statistics
  const stats = useMemo(() => {
    const total = assessments.length;
    const fraudCount = assessments.filter(a => a.fraudDetected).length;
    const totalCompensation = assessments.reduce((sum, a) => sum + (a.finalCompensation || 0), 0);
    const avgRate = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + (a.assessmentRate || 0), 0) / assessments.length 
      : 0;
    return { total, fraudCount, totalCompensation, avgRate };
  }, [assessments]);

  const handleRowClick = (record: CompensationAssessment) => {
    // Navigate to issue detail page
    if (record.issue?.id) {
      navigate(`/staff/issues/${record.issue.id}`);
    }
  };

  const columns: ColumnsType<CompensationAssessment> = [
    {
      title: 'Loại sự cố',
      dataIndex: 'issueType',
      key: 'issueType',
      render: (type, record) => (
        <div>
          <Tag color="blue">{getIssueTypeLabel(type)}</Tag>
          {record.issue?.issueTypeName && (
            <div className="text-xs text-gray-500 mt-1">
              {record.issue.issueTypeName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Tỷ lệ thẩm định',
      dataIndex: 'assessmentRate',
      key: 'assessmentRate',
      width: 120,
      render: (rate) => (
        <Tag color={rate >= 1 ? 'green' : rate >= 0.5 ? 'orange' : 'red'}>
          {formatPercent(rate)}
        </Tag>
      ),
      sorter: (a, b) => (a.assessmentRate || 0) - (b.assessmentRate || 0),
    },
    {
      title: 'Bồi thường theo chính sách',
      dataIndex: 'compensationByPolicy',
      key: 'compensationByPolicy',
      render: (value) => (
        <Text type="secondary">{formatCurrency(value)}</Text>
      ),
      sorter: (a, b) => (a.compensationByPolicy || 0) - (b.compensationByPolicy || 0),
    },
    {
      title: 'Bồi thường cuối cùng',
      dataIndex: 'finalCompensation',
      key: 'finalCompensation',
      render: (value) => (
        <Text strong style={{ color: value > 0 ? '#f5222d' : '#52c41a' }}>
          {formatCurrency(value)}
        </Text>
      ),
      sorter: (a, b) => (a.finalCompensation || 0) - (b.finalCompensation || 0),
    },
    {
      title: 'Gian lận',
      dataIndex: 'fraudDetected',
      key: 'fraudDetected',
      width: 120,
      render: (fraud) => (
        fraud ? (
          <Tag color="red" icon={<WarningOutlined />}>Phát hiện</Tag>
        ) : (
          <Tag color="green" icon={<CheckCircleOutlined />}>Không</Tag>
        )
      ),
      filters: [
        { text: 'Phát hiện gian lận', value: true },
        { text: 'Không gian lận', value: false },
      ],
      onFilter: (value, record) => record.fraudDetected === value,
    },
    {
      title: 'Trạng thái sự cố',
      key: 'issueStatus',
      width: 130,
      render: (_, record) => (
        <Tag color={getIssueStatusColor(record.issue?.status)}>
          {getIssueStatusLabel(record.issue?.status)}
        </Tag>
      ),
    },
    {
      title: 'Người tạo',
      key: 'createdBy',
      render: (_, record) => record.createdByStaff?.fullName || '-',
    },
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <div className="p-6">
      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="Tổng thẩm định"
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #f5222d' }}>
            <Statistic
              title="Phát hiện gian lận"
              value={stats.fraudCount}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: stats.fraudCount > 0 ? '#f5222d' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Tỷ lệ TB"
              value={stats.avgRate * 100}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="Tổng bồi thường"
              value={stats.totalCompensation}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')} ₫`}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="!mb-0" style={{ color: '#1890ff' }}>
            <DollarOutlined className="mr-2" />
            Danh sách thẩm định bồi thường
          </Title>
          <Space>
            <Input
              placeholder="Tìm kiếm theo loại sự cố, mô tả, người tạo..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              style={{ width: 320 }}
              allowClear
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchAssessments}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} thẩm định`,
            }}
            scroll={{ x: 1100 }}
          />
        )}
      </Card>
    </div>
  );
};

export default CompensationAssessmentPage;
