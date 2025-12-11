import React, { useState, forwardRef, useImperativeHandle } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Skeleton,
  Tooltip,
  App,
  Typography,
  Divider,
  Row,
  Col,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { categoryService } from "../../../../services/category";
import type {
  Category,
  CategoryPricing,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateCategoryPricingRequest,
  UpdateCategoryPricingRequest,
} from "../../../../models";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CategoryCombinedListRef {
  showAddModal: () => void;
}

interface CategoryCombinedListProps {
  categories?: Category[];
  categoryPricings?: CategoryPricing[];
  loading?: boolean;
  onRefreshCategories?: () => void;
  onRefreshPricing?: () => void;
}

interface CombinedCategory {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  hasPricing: boolean;
  pricingId?: string;
  priceMultiplier?: number;
  extraFee?: number;
}

const CategoryCombinedList = forwardRef<
  CategoryCombinedListRef,
  CategoryCombinedListProps
>(
  (
    {
      categories = [],
      categoryPricings = [],
      loading = false,
      onRefreshCategories,
      onRefreshPricing,
    },
    ref
  ) => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentItem, setCurrentItem] = useState<CombinedCategory | null>(
      null
    );
    const [form] = Form.useForm();

    useImperativeHandle(ref, () => ({
      showAddModal: () => showModal(),
    }));

    // Combine category and pricing data
    const combinedData: CombinedCategory[] = categories.map((category) => {
      const pricing = categoryPricings.find(
        (p) => p.categoryResponse.id === category.id
      );

      return {
        id: category.id + (pricing?.id || ""), // Unique ID for the row
        categoryId: category.id,
        categoryName: category.categoryName,
        description: category.description,
        hasPricing: !!pricing,
        pricingId: pricing?.id,
        priceMultiplier: pricing?.priceMultiplier,
        extraFee: pricing?.extraFee,
      };
    });

    // Mutations for Category
    const createCategoryMutation = useMutation({
      mutationFn: (data: CreateCategoryRequest) =>
        categoryService.createCategory(data),
      onSuccess: () => {
        message.success("Thêm loại hàng mới thành công");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        if (onRefreshCategories) onRefreshCategories();
      },
      onError: () => {
        message.error("Thêm loại hàng thất bại");
      },
    });

    const updateCategoryMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
        categoryService.updateCategory(id, data),
      onSuccess: () => {
        message.success("Cập nhật loại hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        if (onRefreshCategories) onRefreshCategories();
      },
      onError: () => {
        message.error("Cập nhật loại hàng thất bại");
      },
    });

    const deleteCategoryMutation = useMutation({
      mutationFn: (id: string) => categoryService.deleteCategory(id),
      onSuccess: () => {
        message.success("Xóa loại hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        if (onRefreshCategories) onRefreshCategories();
      },
      onError: () => {
        message.error("Xóa loại hàng thất bại");
      },
    });

    // Mutations for Category Pricing
    const createPricingMutation = useMutation({
      mutationFn: (data: CreateCategoryPricingRequest) =>
        categoryService.createCategoryPricing(data),
      onSuccess: () => {
        message.success("Thêm giá loại hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["categoryPricing"] });
        if (onRefreshPricing) onRefreshPricing();
      },
      onError: () => {
        message.error("Thêm giá loại hàng thất bại");
      },
    });

    const updatePricingMutation = useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: UpdateCategoryPricingRequest;
      }) => categoryService.updateCategoryPricing(id, data),
      onSuccess: () => {
        message.success("Cập nhật giá loại hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["categoryPricing"] });
        if (onRefreshPricing) onRefreshPricing();
      },
      onError: () => {
        message.error("Cập nhật giá loại hàng thất bại");
      },
    });

    const deletePricingMutation = useMutation({
      mutationFn: (id: string) => categoryService.deleteCategoryPricing(id),
      onSuccess: () => {
        message.success("Xóa giá loại hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["categoryPricing"] });
        if (onRefreshPricing) onRefreshPricing();
      },
      onError: () => {
        message.error("Xóa giá loại hàng thất bại");
      },
    });

    const showModal = (item?: CombinedCategory) => {
      if (item) {
        setIsEditing(true);
        setCurrentItem(item);
        form.setFieldsValue({
          categoryName: item.categoryName,
          description: item.description,
          priceMultiplier: item.priceMultiplier,
          extraFee: item.extraFee,
        });
      } else {
        setIsEditing(false);
        setCurrentItem(null);
        form.resetFields();
      }
      setIsModalVisible(true);
    };

    const handleCancel = () => {
      setIsModalVisible(false);
      form.resetFields();
    };

    const handleSubmit = async () => {
      try {
        const values = await form.validateFields();

        if (isEditing && currentItem) {
          // Update existing category
          const categoryData: UpdateCategoryRequest = {
            categoryName: values.categoryName,
            description: values.description,
          };

          await updateCategoryMutation.mutateAsync({
            id: currentItem.categoryId,
            data: categoryData,
          });

          // Update or create pricing if values are provided
          if (
            values.priceMultiplier !== undefined &&
            values.extraFee !== undefined
          ) {
            const pricingData: UpdateCategoryPricingRequest = {
              priceMultiplier: values.priceMultiplier,
              extraFee: values.extraFee,
              categoryId: currentItem.categoryId,
            };

            if (currentItem.hasPricing && currentItem.pricingId) {
              // Update existing pricing
              await updatePricingMutation.mutateAsync({
                id: currentItem.pricingId,
                data: pricingData,
              });
            } else {
              // Create new pricing
              await createPricingMutation.mutateAsync({
                priceMultiplier: values.priceMultiplier,
                extraFee: values.extraFee,
                categoryId: currentItem.categoryId,
              });
            }
          }
        } else {
          // Create new category
          const categoryData: CreateCategoryRequest = {
            categoryName: values.categoryName,
            description: values.description,
          };

          const response = await categoryService.createCategory(categoryData);
          message.success("Thêm loại hàng mới thành công");

          // Refresh categories to get the new ID
          if (onRefreshCategories) onRefreshCategories();

          // If pricing values are provided, create pricing after category is created
          if (
            values.priceMultiplier !== undefined &&
            values.extraFee !== undefined
          ) {
            // We need to get the new category ID
            const newCategories = await categoryService.getCategories();
            const newCategory = newCategories.data?.find(
              (c) => c.categoryName === values.categoryName
            );

            if (newCategory) {
              await createPricingMutation.mutateAsync({
                priceMultiplier: values.priceMultiplier,
                extraFee: values.extraFee,
                categoryId: newCategory.id,
              });
            }
          }
        }

        setIsModalVisible(false);
      } catch (error) {
        console.error("Form validation error:", error);
      }
    };

    const handleDelete = (item: CombinedCategory) => {
      Modal.confirm({
        title: "Xác nhận xóa",
        content: `Bạn có chắc chắn muốn xóa loại hàng "${item.categoryName}" không?`,
        okText: "Xóa",
        okType: "danger",
        cancelText: "Hủy",
        onOk: async () => {
          // Delete pricing first if it exists
          if (item.hasPricing && item.pricingId) {
            await deletePricingMutation.mutateAsync(item.pricingId);
          }
          // Then delete the category
          await deleteCategoryMutation.mutateAsync(item.categoryId);
        },
      });
    };

    const columns = [
      {
        title: "Tên loại hàng",
        dataIndex: "categoryName",
        key: "categoryName",
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
      },
      {
        title: "Hệ số giá",
        dataIndex: "priceMultiplier",
        key: "priceMultiplier",
        render: (value: number | undefined) => {
          return value !== undefined ? (
            value.toFixed(2)
          ) : (
            <span className="text-gray-400 italic">Chưa thiết lập</span>
          );
        },
      },
      {
        title: "Phí bổ sung (VNĐ)",
        dataIndex: "extraFee",
        key: "extraFee",
        render: (value: number | undefined) => {
          return value !== undefined ? (
            value.toLocaleString("vi-VN")
          ) : (
            <span className="text-gray-400 italic">Chưa thiết lập</span>
          );
        },
      },
      {
        title: "Thao tác",
        key: "actions",
        render: (_: any, record: CombinedCategory) => (
          <Space>
            <Tooltip title="Chỉnh sửa">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => showModal(record)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

    if (loading) {
      return <Skeleton active />;
    }

    return (
      <div>
        <Table
          dataSource={combinedData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        {/* Edit/Create Modal */}
        <Modal
          title={
            <Typography.Title level={4} style={{ margin: 0 }}>
              {isEditing ? "Chỉnh sửa loại hàng" : "Thêm loại hàng mới"}
            </Typography.Title>
          }
          open={isModalVisible}
          onCancel={handleCancel}
          onOk={handleSubmit}
          okText={isEditing ? "Cập nhật" : "Thêm mới"}
          cancelText="Hủy"
          okButtonProps={{ type: "primary" }}
          cancelButtonProps={{ type: "default" }}
          confirmLoading={
            createCategoryMutation.isPending ||
            updateCategoryMutation.isPending ||
            createPricingMutation.isPending ||
            updatePricingMutation.isPending
          }
          width={560}
          maskClosable={
            !(
              createCategoryMutation.isPending ||
              updateCategoryMutation.isPending ||
              createPricingMutation.isPending ||
              updatePricingMutation.isPending
            )
          }
          closable={
            !(
              createCategoryMutation.isPending ||
              updateCategoryMutation.isPending ||
              createPricingMutation.isPending ||
              updatePricingMutation.isPending
            )
          }
          keyboard={
            !(
              createCategoryMutation.isPending ||
              updateCategoryMutation.isPending ||
              createPricingMutation.isPending ||
              updatePricingMutation.isPending
            )
          }
          bodyStyle={{ padding: 24, paddingTop: 16 }}
        >
          <Form form={form} layout="vertical" size="middle">
            <Typography.Title
              level={5}
              style={{ marginBottom: 4, color: "#1d4ed8" }}
            >
              Thông tin loại hàng
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Thiết lập tên và mô tả cho loại hàng để thuận tiện tra cứu và báo
              giá.
            </Typography.Paragraph>

            <Form.Item
              name="categoryName"
              label="Tên loại hàng"
              rules={[
                { required: true, message: "Vui lòng nhập tên loại hàng" },
              ]}
            >
              <Input placeholder="Ví dụ: HÀNG THƯỜNG, HÀNG DỄ VỠ" allowClear />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Mô tả ngắn gọn về đặc điểm loại hàng này"
                showCount
                maxLength={200}
              />
            </Form.Item>

            <Divider style={{ margin: "16px 0 12px" }}>
              <Typography.Text strong>Thông tin giá</Typography.Text>
            </Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="priceMultiplier"
                  label="Hệ số giá"
                  tooltip="Nếu để trống, hệ thống sẽ dùng hệ số mặc định là 1.00"
                  rules={[
                    {
                      required: false,
                      message: "Vui lòng nhập hệ số giá",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    step={0.1}
                    precision={2}
                    style={{ width: "100%" }}
                    placeholder="Ví dụ: 1.00, 1.50"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="extraFee"
                  label="Phí bổ sung (VNĐ)"
                  tooltip="Phí cộng thêm cho loại hàng này, có thể để 0 nếu không áp dụng"
                  rules={[
                    {
                      required: false,
                      message: "Vui lòng nhập phí bổ sung",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    step={1000}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value: string | undefined) =>
                      value ? Number(value.replace(/\$\s?|(,*)/g, "")) : 0
                    }
                    style={{ width: "100%" }}
                    placeholder="Ví dụ: 10.000"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>
              Bạn có thể cập nhật lại hệ số giá và phí bổ sung sau trong trang
              quản lý bảng giá.
            </Typography.Paragraph> */}
          </Form>
        </Modal>
      </div>
    );
  }
);

export default CategoryCombinedList;
