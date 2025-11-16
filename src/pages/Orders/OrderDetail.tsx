import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, App, Form, Input, DatePicker, InputNumber } from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  CameraOutlined,
  TruckOutlined,
  UserOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useCustomerOrderDetail } from "@/hooks";
import type { CreateContractRequest } from "../../services/contract/types";
import dayjs from "dayjs";
import {
  OrderDetailSkeleton,
  OrderStatusCard,
  OrderInfoCard,
  AddressCard,
  SenderInfoCard,
  OrderDetailsTable,
  OrderSizeCard,
  VehicleAssignmentCard,
} from "../../components/features/order";
import OrderStatusBreakdown from "../../components/common/OrderStatusBreakdown";

const { confirm } = Modal;

const OrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const messageApi = App.useApp().message;
  const { order, contract, loading, error, deleteOrder, refetch } = useCustomerOrderDetail();
  const [contractModalVisible, setContractModalVisible] =
    useState<boolean>(false);
  const [contractForm] = Form.useForm();
  const [creatingContract, setCreatingContract] = useState<boolean>(false);

  const handleDelete = () => {
    if (!order?.id) return;

    confirm({
      title: "Xác nhận xóa đơn hàng",
      icon: <ExclamationCircleOutlined />,
      content:
        "Bạn có chắc chắn muốn xóa đơn hàng này không? Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteOrder();
          messageApi.success("Đơn hàng đã được xóa thành công");
          navigate("/orders");
        } catch (error) {
          messageApi.error("Không thể xóa đơn hàng");
          console.error("Error deleting order:", error);
        }
      },
    });
  };

  const handleEdit = () => {
    if (!order?.id) return;
    navigate(`/orders/${order.id}/edit`);
  };

  const handleCreateContract = () => {
    if (!order?.id) return;
    contractForm.setFieldsValue({
      contractName: `Hợp đồng đơn hàng ${order.orderCode}`,
      effectiveDate: dayjs(),
      expirationDate: dayjs().add(1, "year"),
      adjustedValue: order.totalPrice || 0,
      description: `Hợp đồng vận chuyển cho đơn hàng ${order.orderCode}`,
      orderId: order.id,
      staffId: "",
    });

    setContractModalVisible(true);
  };

  // Xử lý submit form tạo hợp đồng
  const handleContractSubmit = async (values: any) => {
    if (!order?.id) return;
    
    setCreatingContract(true);
    try {
      const contractData: CreateContractRequest = {
        ...values,
        effectiveDate: values.effectiveDate.format("YYYY-MM-DDTHH:mm:ss"),
        expirationDate: values.expirationDate.format("YYYY-MM-DDTHH:mm:ss"),
        orderId: order.id,
        staffId: "", // TODO: Get from auth context
      };

      // TODO: Add createContract to hook or use contractService directly
      // For now, just close modal
      messageApi.info("Contract creation needs to be implemented in hook");
      setContractModalVisible(false);
      contractForm.resetFields();
    } catch (error) {
      messageApi.error("Có lỗi xảy ra khi tạo hợp đồng");
    } finally {
      setCreatingContract(false);
    }
  };

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">
            Không tìm thấy đơn hàng
          </h2>
          <p className="text-gray-500 mb-4">
            Đơn hàng không tồn tại hoặc đã bị xóa
          </p>
          <Button type="primary" onClick={() => navigate("/orders")}>
            Quay lại danh sách đơn hàng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header section with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <Button
                  type="default"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/orders")}
                  className="mr-2 bg-white"
                >
                  Quay lại
                </Button>
                <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
              </div>
              <p className="text-blue-100 mt-1">
                Mã đơn hàng: {order.orderCode}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="default"
                icon={<FileTextOutlined />}
                onClick={handleCreateContract}
                className="bg-green-500 hover:bg-green-600 border-green-500 text-white"
              >
                Tạo hợp đồng
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                Chỉnh sửa
              </Button>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Order Status Card */}
        <OrderStatusCard order={order} />

        {/* Order Status Breakdown - Show detailed breakdown if order has multiple details */}
        {order && order.orderDetails && order.orderDetails.length > 0 && (
          <div className="mb-6">
            <OrderStatusBreakdown 
              orderDetails={order.orderDetails}
              currentOrderStatus={order.status}
              showExplanation={true}
              showWarning={true}
            />
          </div>
        )}

        {/* Order Information Card */}
        <OrderInfoCard order={order} />

        {/* Address Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Pickup Address */}
          {order.pickupAddress && (
            <AddressCard
              address={order.pickupAddress}
              title="Địa chỉ lấy hàng"
              isPickup={true}
            />
          )}

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <AddressCard
              address={order.deliveryAddress}
              title="Địa chỉ giao hàng"
              isPickup={false}
            />
          )}
        </div>

        {/* Sender Information */}
        {order.sender && <SenderInfoCard sender={order.sender} />}

        {/* Chi tiết vận chuyển */}
        {order.orderDetails && order.orderDetails.length > 0 && (
          <OrderDetailsTable orderDetails={order.orderDetails} />
        )}

        {/* Order Size Information */}
        {order.orderDetails &&
          order.orderDetails.length > 0 &&
          order.orderDetails[0].orderSizeId && (
            <OrderSizeCard orderSize={order.orderDetails[0].orderSizeId} />
          )}

        {/* Vehicle Assignment Information */}
        {order.orderDetails &&
          order.orderDetails.length > 0 &&
          order.orderDetails[0].vehicleAssignmentId && (
            <VehicleAssignmentCard
              vehicleAssignment={order.orderDetails[0].vehicleAssignmentId}
            />
          )}
      </div>

      {/* Contract Creation Modal */}
      <Modal
        title="Tạo hợp đồng"
        open={contractModalVisible}
        onCancel={() => setContractModalVisible(false)}
        onOk={() => contractForm.submit()}
        confirmLoading={creatingContract}
        width={600}
        okText="Tạo hợp đồng"
        cancelText="Hủy"
      >
        <Form
          form={contractForm}
          layout="vertical"
          onFinish={handleContractSubmit}
        >
          <Form.Item
            label="Tên hợp đồng"
            name="contractName"
            rules={[{ required: true, message: "Vui lòng nhập tên hợp đồng" }]}
          >
            <Input placeholder="Nhập tên hợp đồng" />
          </Form.Item>

          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              label="Ngày hiệu lực"
              name="effectiveDate"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: "Vui lòng chọn ngày hiệu lực" },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Chọn ngày hiệu lực"
                showTime
              />
            </Form.Item>

            <Form.Item
              label="Ngày hết hạn"
              name="expirationDate"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: "Vui lòng chọn ngày hết hạn" },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Chọn ngày hết hạn"
                showTime
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Giá trị hỗ trợ"
            name="adjustedValue"
            rules={[
              { required: true, message: "Vui lòng nhập giá trị hỗ trợ" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá trị hỗ trợ"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              addonAfter="VNĐ"
            />
          </Form.Item>
          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả hợp đồng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
