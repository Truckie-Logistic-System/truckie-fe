import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Button, 
  Space, 
  Modal, 
  Form, 
  message, 
  Skeleton,
  Typography,
  Popconfirm,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import fuelTypeService from '@/services/vehicle/fuelTypeService';
import type { 
  FuelType, 
  CreateFuelTypeRequest, 
  UpdateFuelTypeRequest 
} from '@/services/vehicle/fuelTypeService';
import debounce from 'lodash/debounce';

const { Title } = Typography;
const { TextArea } = Input;

const FuelTypePage: React.FC = () => {
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FuelType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchFuelTypes = async () => {
    setLoading(true);
    try {
      const data = await fuelTypeService.getAllFuelTypes();
      setFuelTypes(data);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách loại nhiên liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelTypes();
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchText(value), 300),
    []
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const filteredData = useMemo(() => {
    if (!searchText) return fuelTypes;
    const lowerSearch = searchText.toLowerCase();
    return fuelTypes.filter(item => 
      item.name?.toLowerCase().includes(lowerSearch) ||
      item.description?.toLowerCase().includes(lowerSearch)
    );
  }, [fuelTypes, searchText]);

  const handleOpenModal = (item?: FuelType) => {
    if (item) {
      setEditingItem(item);
      form.setFieldsValue({
        name: item.name,
        description: item.description,
      });
    } else {
      setEditingItem(null);
      form.resetFields();
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
        const request: UpdateFuelTypeRequest = {
          id: editingItem.id,
          ...values,
        };
        await fuelTypeService.updateFuelType(request);
        message.success('Cập nhật loại nhiên liệu thành công');
      } else {
        const request: CreateFuelTypeRequest = values;
        await fuelTypeService.createFuelType(request);
        message.success('Tạo loại nhiên liệu thành công');
      }

      handleCloseModal();
      fetchFuelTypes();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fuelTypeService.deleteFuelType(id);
      message.success('Xóa loại nhiên liệu thành công');
      fetchFuelTypes();
    } catch (error: any) {
      message.error(error.message || 'Không thể xóa loại nhiên liệu');
    }
  };

  const handleRowClick = (record: FuelType) => {
    handleOpenModal(record);
  };

  const columns: ColumnsType<FuelType> = [
    {
      title: 'Tên loại nhiên liệu',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa loại nhiên liệu này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-2">
        <Title level={2} className="!m-0 flex items-center text-blue-800">
          <ThunderboltOutlined className="mr-2 text-blue-600" />
          Quản lý loại nhiên liệu
        </Title>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="Tổng loại nhiên liệu"
              value={fuelTypes.length}
              prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="!mb-0" style={{ color: '#1890ff' }}>
            <ThunderboltOutlined className="mr-2" />
            Quản lý loại nhiên liệu
          </Title>
          <Space>
            <Input
              placeholder="Tìm kiếm theo tên hoặc mô tả nhiên liệu..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchFuelTypes}
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
              showTotal: (total) => `Tổng ${total} loại nhiên liệu`,
            }}
          />
        )}
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <ThunderboltOutlined style={{ color: '#1890ff' }} />
            <span>{editingItem ? 'Cập nhật loại nhiên liệu' : 'Thêm loại nhiên liệu mới'}</span>
          </div>
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingItem ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Tên loại nhiên liệu"
            rules={[{ required: true, message: 'Vui lòng nhập tên loại nhiên liệu' }]}
          >
            <Input placeholder="Nhập tên loại nhiên liệu (VD: Xăng RON 95, Dầu Diesel...)" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Nhập mô tả (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FuelTypePage;
