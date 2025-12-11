import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Select, 
  Switch,
  message, 
  Skeleton,
  Typography,
  Tooltip,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import issueTypeService from '@/services/issue/issueTypeService';
import type { 
  IssueType, 
  CreateIssueTypeRequest, 
  UpdateIssueTypeRequest 
} from '@/services/issue/issueTypeService';
import debounce from 'lodash/debounce';

const { Title } = Typography;
const { TextArea } = Input;

const ISSUE_CATEGORIES = [
  { value: 'DAMAGE', label: 'Hư hỏng' },
  { value: 'DELAY', label: 'Trễ hẹn' },
  { value: 'ORDER_REJECTION', label: 'Từ chối đơn hàng' },
  { value: 'REJECTION', label: 'Từ chối nhận hàng' },
  { value: 'REROUTE', label: 'Tái định tuyến' },
  { value: 'OFF_ROUTE', label: 'Lệch tuyến' },
  { value: 'OFF_ROUTE_RUNAWAY', label: 'Lệch tuyến bỏ trốn' },
  { value: 'SEAL_REPLACEMENT', label: 'Thay thế seal' },
  { value: 'SEAL', label: 'Seal' },
  { value: 'PENALTY', label: 'Vi phạm' },
  { value: 'GENERAL', label: 'Chung' },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    DAMAGE: 'red',
    DELAY: 'orange',
    ORDER_REJECTION: 'volcano',
    REJECTION: 'volcano',
    REROUTE: 'purple',
    OFF_ROUTE: 'magenta',
    OFF_ROUTE_RUNAWAY: 'red',
    SEAL_REPLACEMENT: 'blue',
    SEAL: 'blue',
    PENALTY: 'gold',
    GENERAL: 'default',
  };
  return colors[category] || 'default';
};

const getCategoryLabel = (category: string) => {
  const found = ISSUE_CATEGORIES.find(c => c.value === category);
  return found?.label || category;
};

const IssueTypePage: React.FC = () => {
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<IssueType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Statistics
  const stats = useMemo(() => {
    const total = issueTypes.length;
    const activeCount = issueTypes.filter(i => i.isActive).length;
    const inactiveCount = total - activeCount;
    return { total, activeCount, inactiveCount };
  }, [issueTypes]);

  const handleRowClick = (record: IssueType) => {
    handleOpenModal(record);
  };

  const fetchIssueTypes = async () => {
    setLoading(true);
    try {
      const data = await issueTypeService.getAllIssueTypes();
      setIssueTypes(data);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách loại sự cố');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueTypes();
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchText(value), 300),
    []
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const filteredData = useMemo(() => {
    if (!searchText) return issueTypes;
    const lowerSearch = searchText.toLowerCase();
    return issueTypes.filter(item => 
      item.issueTypeName?.toLowerCase().includes(lowerSearch) ||
      item.description?.toLowerCase().includes(lowerSearch) ||
      getCategoryLabel(item.issueCategory)?.toLowerCase().includes(lowerSearch)
    );
  }, [issueTypes, searchText]);

  const handleOpenModal = (item?: IssueType) => {
    if (item) {
      setEditingItem(item);
      form.setFieldsValue({
        issueTypeName: item.issueTypeName,
        description: item.description,
        issueCategory: item.issueCategory,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingItem) {
        const request: UpdateIssueTypeRequest = {
          id: editingItem.id,
          ...values,
        };
        await issueTypeService.updateIssueType(request);
        message.success('Cập nhật loại sự cố thành công');
      } else {
        const request: CreateIssueTypeRequest = values;
        await issueTypeService.createIssueType(request);
        message.success('Tạo loại sự cố thành công');
      }

      handleCloseModal();
      fetchIssueTypes();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<IssueType> = [
    {
      title: 'Tên loại sự cố',
      dataIndex: 'issueTypeName',
      key: 'issueTypeName',
      sorter: (a, b) => a.issueTypeName.localeCompare(b.issueTypeName),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'issueCategory',
      key: 'issueCategory',
      render: (category) => (
        <Tag color={getCategoryColor(category)}>
          {getCategoryLabel(category)}
        </Tag>
      ),
      filters: ISSUE_CATEGORIES.map(c => ({ text: c.label, value: c.value })),
      onFilter: (value, record) => record.issueCategory === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Không hoạt động', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
  ];

  return (
    <div className="p-6">
      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="Tổng loại sự cố"
              value={stats.total}
              prefix={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Đang hoạt động"
              value={stats.activeCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #d9d9d9' }}>
            <Statistic
              title="Không hoạt động"
              value={stats.inactiveCount}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="!mb-0" style={{ color: '#1890ff' }}>
            Quản lý loại sự cố
          </Title>
          <Space>
            <Input
              placeholder="Tìm kiếm theo tên hoặc danh mục sự cố..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchIssueTypes}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Thêm mới
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
              showTotal: (total) => `Tổng ${total} loại sự cố`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editingItem ? 'Cập nhật loại sự cố' : 'Thêm loại sự cố mới'}
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingItem ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="issueTypeName"
            label="Tên loại sự cố"
            rules={[{ required: true, message: 'Vui lòng nhập tên loại sự cố' }]}
          >
            <Input placeholder="Nhập tên loại sự cố" />
          </Form.Item>

          <Form.Item
            name="issueCategory"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập danh mục' }]}
          >
            <Input 
              placeholder="Nhập danh mục (VD: DAMAGE, DELAY, ORDER_REJECTION, OFF_ROUTE, SEAL_REPLACEMENT, PENALTY, GENERAL...)"
              list="category-list"
            />
            <datalist id="category-list">
              {ISSUE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </datalist>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Nhập mô tả (không bắt buộc)" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Hoạt động" 
              unCheckedChildren="Không hoạt động"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IssueTypePage;
