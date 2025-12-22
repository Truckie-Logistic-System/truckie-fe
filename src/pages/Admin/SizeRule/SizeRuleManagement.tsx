import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Divider,
  Typography,
  Descriptions,
  Tabs,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  BoxPlotOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sizeRuleService } from "@/services/sizeRuleService";
import type { SizeRule, SizeRuleRequest } from "@/models/SizeRule";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const SizeRuleManagement: React.FC = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SizeRule | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Helper function to convert vehicle type name to enum value
  const getEnumValueFromVehicleType = (type: any): string => {
    // Try to extract enum value from vehicleTypeName or description
    // Format: "Xe tải 0.5 tấn" -> "TRUCK_0_5_TON"
    const name = type.vehicleTypeName || type.description || type.name || "";

    // If already in enum format (contains underscores and uppercase), return as is
    if (name.includes("_") && name === name.toUpperCase()) {
      return name;
    }

    // Try to convert Vietnamese description to enum
    // Extract the tonnage number
    const tonnageMatch = name.match(/(\d+\.?\d*)\s*t[ấa]n/i);
    if (tonnageMatch) {
      const tonnage = tonnageMatch[1].replace(".", "_");
      return `TRUCK_${tonnage}_TON`;
    }

    // Fallback: return the original name
    return name;
  };

  // Fetch size rules
  const {
    data: sizeRulesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["sizeRules", searchText, filterStatus],
    queryFn: () =>
      sizeRuleService.getSizeRules({
        search: searchText || undefined,
        status: filterStatus || undefined,
      }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["sizeRuleCategories"],
    queryFn: () => sizeRuleService.getCategories(),
  });
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Set initial active category when categories are loaded
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Filter data by active category on client side
  const filteredData = React.useMemo(() => {
    if (!sizeRulesData?.data || !activeCategory) return [];

    return sizeRulesData.data.filter((rule: SizeRule) => {
      const ruleCategoryId = rule.category?.id || rule.categoryId;
      return ruleCategoryId === activeCategory;
    });
  }, [sizeRulesData, activeCategory]);

  // Fetch vehicle types
  const { data: vehicleTypesData } = useQuery({
    queryKey: ["sizeRuleVehicleTypes"],
    queryFn: () => sizeRuleService.getVehicleTypes(),
  });
  const vehicleTypes = Array.isArray(vehicleTypesData) ? vehicleTypesData : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: SizeRuleRequest) => sizeRuleService.createSizeRule(data),
    onSuccess: (response) => {
      const successMessage =
        response?.message || "Tạo quy tắc kích thước thành công!";
      message.success(successMessage);
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["sizeRules"] });
      queryClient.invalidateQueries({ queryKey: ["sizeRulesPublic"] });
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo quy tắc kích thước";
      message.error(`Tạo thất bại: ${errorMsg}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SizeRuleRequest }) =>
      sizeRuleService.updateSizeRule(id, data as any),
    onSuccess: (response) => {
      const successMessage = "Thành công";
      message.success(successMessage);
      setIsModalOpen(false);
      setEditingRule(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["sizeRules"] });
      queryClient.invalidateQueries({ queryKey: ["sizeRulesPublic"] });
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể cập nhật quy tắc kích thước";
      message.error(`Cập nhật thất bại: ${errorMsg}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => sizeRuleService.deleteSizeRule(id),
    onSuccess: (response) => {
      const successMessage =
        response?.message || "Xóa quy tắc kích thước thành công!";
      message.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ["sizeRules"] });
      queryClient.invalidateQueries({ queryKey: ["sizeRulesPublic"] });
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xóa quy tắc kích thước";
      message.error(`Xóa thất bại: ${errorMsg}`);
    },
  });

  const handleCreate = () => {
    setEditingRule(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: SizeRule) => {
    setEditingRule(record);
    form.setFieldsValue({
      sizeRuleName: record.sizeRuleName,
      minWeight: record.minWeight,
      maxWeight: record.maxWeight,
      minLength: record.minLength,
      maxLength: record.maxLength,
      minWidth: record.minWidth,
      maxWidth: record.maxWidth,
      minHeight: record.minHeight,
      maxHeight: record.maxHeight,
      effectiveDates: [
        dayjs(record.effectiveFrom),
        record.effectiveTo ? dayjs(record.effectiveTo) : null,
      ],
      vehicleTypeId: record.vehicleTypeEntity?.id || record.vehicleTypeId,
      categoryId: record.category?.id || record.categoryId,
      status: record.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async () => {
    if (!editingRule) {
      message.warning("Chỉ có thể cập nhật quy tắc kích thước!");
      return;
    }

    try {
      const values = await form.validateFields();
      const [effectiveFrom, effectiveTo] = values.effectiveDates || [];

      const requestData: any = {
        minWeight: values.minWeight,
        maxWeight: values.maxWeight,
        minLength: values.minLength,
        maxLength: values.maxLength,
        minWidth: values.minWidth,
        maxWidth: values.maxWidth,
        minHeight: values.minHeight,
        maxHeight: values.maxHeight,
        effectiveFrom: effectiveFrom?.format("YYYY-MM-DDTHH:mm:ss"),
        effectiveTo: effectiveTo?.format("YYYY-MM-DDTHH:mm:ss"),
        vehicleTypeId: values.vehicleTypeId,
        categoryId: values.categoryId,
        status: values.status || "ACTIVE",
      };

      updateMutation.mutate({ id: editingRule.id, data: requestData });
    } catch (error) {
      message.warning("Vui lòng kiểm tra lại thông tin nhập vào!");
    }
  };

  const columns = [
    {
      title: "Loại xe",
      dataIndex: "sizeRuleName",
      key: "sizeRuleName",
      width: 180,
      fixed: "left" as const,
      render: (text: string) => (
        <Text strong style={{ color: "#1890ff" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Trọng lượng (Tấn)",
      key: "weight",
      width: 140,
      render: (_: any, record: SizeRule) => (
        <Tag color="blue" style={{ fontSize: 13 }}>
          {record.minWeight} - {record.maxWeight}
        </Tag>
      ),
    },
    {
      title: "Dài (m)",
      key: "length",
      width: 110,
      render: (_: any, record: SizeRule) => (
        <Text type="secondary">
          {record.minLength} - {record.maxLength}
        </Text>
      ),
    },
    {
      title: "Rộng (m)",
      key: "width",
      width: 110,
      render: (_: any, record: SizeRule) => (
        <Text type="secondary">
          {record.minWidth} - {record.maxWidth}
        </Text>
      ),
    },
    {
      title: "Cao (m)",
      key: "height",
      width: 110,
      render: (_: any, record: SizeRule) => (
        <Text type="secondary">
          {record.minHeight} - {record.maxHeight}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      fixed: "right" as const,
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "success" : "default"}>
          {status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      fixed: "right" as const,
      width: 150,
      render: (_: any, record: SizeRule) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa quy tắc kích thước"
            description="Bạn có chắc chắn muốn xóa quy tắc này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px", background: "#f0f2f5", minHeight: "100vh" }}>
      <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 20 }}>
          <Col flex="auto">
            <Space align="center">
              <BoxPlotOutlined style={{ fontSize: 28, color: "#1890ff" }} />
              <Title level={3} style={{ margin: 0 }}>
                Quản lý quy tắc kích thước thùng xe
              </Title>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        {/* Tabs by Category */}
        <Tabs
          activeKey={activeCategory}
          onChange={setActiveCategory}
          type="card"
          size="large"
          style={{ marginBottom: 20 }}
          items={categories?.map((cat: any) => ({
            key: cat.id,
            label: (
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                {cat.description || cat.categoryName}
              </span>
            ),
          }))}
        />

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 900 }}
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showTotal: (total) => (
              <Text strong style={{ fontSize: 14 }}>
                Tổng số: <Text type="success">{total}</Text> quy tắc
              </Text>
            ),
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            size: "default",
          }}
          bordered
          size="middle"
          rowClassName={(_, index) =>
            index % 2 === 0 ? "table-row-light" : "table-row-dark"
          }
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          <Space>
            <BoxPlotOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <Text strong style={{ fontSize: 16 }}>
              {editingRule
                ? "Chỉnh sửa quy tắc kích thước"
                : "Thêm quy tắc kích thước mới"}
            </Text>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRule(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        width={900}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText="Cập nhật"
        cancelText="Hủy"
        okButtonProps={{ size: "large" }}
        cancelButtonProps={{ size: "large" }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vehicleTypeId"
                label={<Text strong>Loại xe</Text>}
                rules={[{ required: true, message: "Vui lòng chọn loại xe" }]}
              >
                <Select
                  placeholder="Chọn loại xe"
                  showSearch
                  optionFilterProp="children"
                  size="large"
                  disabled={!!editingRule}
                  onChange={(value) => {
                    // Auto-fill sizeRuleName based on selected vehicle type
                    const selectedType = vehicleTypes?.find(
                      (t: any) => t.id === value
                    );
                    if (selectedType) {
                      const enumValue =
                        getEnumValueFromVehicleType(selectedType);
                      form.setFieldsValue({
                        sizeRuleName: enumValue,
                      });
                    }
                  }}
                >
                  {vehicleTypes?.map((type: any) => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.description || type.vehicleTypeName || type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label={<Text strong>Danh mục hàng hóa</Text>}
                rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  showSearch
                  optionFilterProp="children"
                  size="large"
                  disabled={!!editingRule}
                >
                  {categories?.map((cat: any) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.description || cat.categoryName || cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="sizeRuleName"
            label={<Text strong>Tên quy tắc (enum)</Text>}
            rules={[{ required: true, message: "Vui lòng nhập tên quy tắc" }]}
            style={{ display: "none" }}
          >
            <Input />
          </Form.Item>

          <Divider orientation="left">
            <Text strong style={{ color: "#1890ff" }}>
              Trọng lượng (Tấn)
            </Text>
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minWeight"
                label="Tối thiểu"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập trọng lượng tối thiểu",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxWeight = getFieldValue("maxWeight");
                      if (!value || !maxWeight || value <= maxWeight) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          "Trọng lượng tối thiểu phải nhỏ hơn hoặc bằng tối đa"
                        )
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                  addonAfter="Tấn"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxWeight"
                label="Tối đa"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập trọng lượng tối đa",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minWeight = getFieldValue("minWeight");
                      if (!value || !minWeight || value >= minWeight) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          "Trọng lượng tối đa phải lớn hơn hoặc bằng tối thiểu"
                        )
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                  addonAfter="Tấn"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Text strong style={{ color: "#1890ff" }}>
              Kích thước thùng xe (m)
            </Text>
          </Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="minLength"
                label="Dài (min)"
                rules={[
                  { required: true, message: "Vui lòng nhập" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxLength = getFieldValue("maxLength");
                      if (!value || !maxLength || value <= maxLength) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Min phải ≤ Max"));
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="0"
                  addonAfter="m"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxLength"
                label="Dài (max)"
                rules={[
                  { required: true, message: "Vui lòng nhập" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minLength = getFieldValue("minLength");
                      if (!value || !minLength || value >= minLength) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Max phải ≥ Min"));
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="0"
                  addonAfter="m"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center", paddingTop: 30 }}>
                <Tag color="blue" style={{ fontSize: 13 }}>
                  Chiều dài thùng xe
                </Tag>
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="minWidth"
                label="Rộng (min)"
                rules={[
                  { required: true, message: "Vui lòng nhập" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxWidth = getFieldValue("maxWidth");
                      if (!value || !maxWidth || value <= maxWidth) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Min phải ≤ Max"));
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="0"
                  addonAfter="m"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxWidth"
                label="Rộng (max)"
                rules={[
                  { required: true, message: "Vui lòng nhập" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minWidth = getFieldValue("minWidth");
                      if (!value || !minWidth || value >= minWidth) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Max phải ≥ Min"));
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="0"
                  addonAfter="m"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center", paddingTop: 30 }}>
                <Tag color="green" style={{ fontSize: 13 }}>
                  Chiều rộng thùng xe
                </Tag>
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="minHeight"
                label="Cao (min)"
                rules={[
                  { required: true, message: "Vui lòng nhập" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxHeight = getFieldValue("maxHeight");
                      if (!value || !maxHeight || value <= maxHeight) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Min phải ≤ Max"));
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="0"
                  addonAfter="m"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxHeight"
                label="Cao (max)"
                rules={[
                  { required: true, message: "Vui lòng nhập" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minHeight = getFieldValue("minHeight");
                      if (!value || !minHeight || value >= minHeight) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Max phải ≥ Min"));
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="0"
                  addonAfter="m"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center", paddingTop: 30 }}>
                <Tag color="orange" style={{ fontSize: 13 }}>
                  Chiều cao thùng xe
                </Tag>
              </div>
            </Col>
          </Row>

          <Divider orientation="left">
            <Text strong style={{ color: "#1890ff" }}>
              Thời hạn hiệu lực
            </Text>
          </Divider>
          <Form.Item
            name="effectiveDates"
            label="Thời gian hiệu lực"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian hiệu lực" },
            ]}
          >
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              size="large"
              disabled={!!editingRule}
            />
          </Form.Item>

          {editingRule && (
            <Form.Item
              name="status"
              label={<Text strong>Trạng thái</Text>}
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select placeholder="Chọn trạng thái" size="large">
                <Select.Option value="ACTIVE">
                  <Tag color="success">Hoạt động</Tag>
                </Select.Option>
                <Select.Option value="INACTIVE">
                  <Tag color="default">Không hoạt động</Tag>
                </Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default SizeRuleManagement;
