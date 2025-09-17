import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  App,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Card,
} from "antd";
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
import orderService from "../../services/order/orderService";
import { contractService } from "../../services/contract";
import type { Order } from "../../models";
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

const { confirm } = Modal;

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageApi = App.useApp().message;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [contractModalVisible, setContractModalVisible] =
    useState<boolean>(false);
  const [contractForm] = Form.useForm();
  const [creatingContract, setCreatingContract] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const fetchOrderDetails = async (orderId: string) => {
    setLoading(true);
    try {
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      messageApi.error("Không thể tải thông tin đơn hàng");
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;

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
          await orderService.deleteOrder(id);
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
    if (!id) return;
    navigate(`/orders/${id}/edit`);
  };

  const handleCreateContract = () => {
    if (!id || !order) return;
    contractForm.setFieldsValue({
      contractName: `Hợp đồng đơn hàng ${order.orderCode}`,
      effectiveDate: dayjs(),
      expirationDate: dayjs().add(1, "year"),
      supportedValue: order.totalPrice || 0,
      description: `Hợp đồng vận chuyển cho đơn hàng ${order.orderCode}`,
      orderId: id,
      staffId: "",
    });

    setContractModalVisible(true);
  };

  // Xử lý submit form tạo hợp đồng
  const handleContractSubmit = async (values: any) => {
    setCreatingContract(true);
    try {
      const contractData: CreateContractRequest = {
        ...values,
        effectiveDate: values.effectiveDate.format("YYYY-MM-DDTHH:mm:ss"),
        expirationDate: values.expirationDate.format("YYYY-MM-DDTHH:mm:ss"),
        orderId: id!,
        staffId: "", // TODO: Get from auth context
      };

      const result = await contractService.createContract(contractData);

      if (result.success) {
        messageApi.success("Hợp đồng đã được tạo thành công");
        setContractModalVisible(false);
        contractForm.resetFields();
      } else {
        messageApi.error(result.message);
      }
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

        {/* Order Information Card */}
        <OrderInfoCard order={order} />

        {/* Address Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Pickup Address */}
          {order.pickupAddress && (
            <AddressCard
              address={order.pickupAddress}
              title="Địa chỉ lấy hàng"
              type="pickup"
            />
          )}

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <AddressCard
              address={order.deliveryAddress}
              title="Địa chỉ giao hàng"
              type="delivery"
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

        {/* Deposit Information */}
        <Card className="shadow-md rounded-xl mb-6">
          <div className="flex items-center mb-4">
            <DollarOutlined className="text-2xl text-green-600 mr-3" />
            <h3 className="text-lg font-semibold">Thông tin cọc tiền</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Số tiền cọc</p>
              <p className="text-lg font-bold text-green-600">
                {(order as any)?.depositAmount
                  ? `${(order as any).depositAmount?.toLocaleString()} VNĐ`
                  : "Chưa có thông tin"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Trạng thái thanh toán</p>
              <p className="text-lg font-semibold">
                {(order as any)?.depositStatus || "Chưa có thông tin"}
              </p>
            </div>
          </div>
        </Card>

        {/* Driver Information */}
        <Card className="shadow-md rounded-xl mb-6">
          <div className="flex items-center mb-4">
            <UserOutlined className="text-2xl text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold">Thông tin tài xế</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Tên tài xế</p>
              <p className="text-lg font-semibold">
                {(order as any)?.driverName || "Chưa có thông tin"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Số điện thoại</p>
              <p className="text-lg font-semibold">
                {(order as any)?.driverPhone || "Chưa có thông tin"}
              </p>
            </div>
          </div>
        </Card>

        {/* Vehicle Information */}
        <Card className="shadow-md rounded-xl mb-6">
          <div className="flex items-center mb-4">
            <TruckOutlined className="text-2xl text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold">Thông tin xe nhận đơn</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Biển số xe</p>
              <p className="text-lg font-semibold">
                {(order as any)?.vehiclePlate || "Chưa có thông tin"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Loại xe</p>
              <p className="text-lg font-semibold">
                {(order as any)?.vehicleType || "Chưa có thông tin"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Tải trọng</p>
              <p className="text-lg font-semibold">
                {(order as any)?.vehicleCapacity || "Chưa có thông tin"}
              </p>
            </div>
          </div>
        </Card>

        {/* Delivery Proof Images */}
        <Card className="shadow-md rounded-xl mb-6">
          <div className="flex items-center mb-4">
            <CameraOutlined className="text-2xl text-orange-600 mr-3" />
            <h3 className="text-lg font-semibold">Minh chứng giao hàng</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(order as any)?.deliveryImages &&
            (order as any).deliveryImages.length > 0 ? (
              (order as any).deliveryImages.map(
                (image: string, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden"
                  >
                    <img
                      src={image}
                      alt={`Ảnh giao hàng ${index + 1}`}
                      className="w-full h-32 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => window.open(image, "_blank")}
                    />
                  </div>
                )
              )
            ) : (
              <div className="col-span-4 bg-gray-50 p-8 rounded-lg text-center">
                <CameraOutlined className="text-4xl text-gray-400 mb-2" />
                <p className="text-gray-500">
                  Chưa có hình ảnh minh chứng giao hàng
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Transport Fee Proof */}
        <Card className="shadow-md rounded-xl mb-6">
          <div className="flex items-center mb-4">
            <DollarOutlined className="text-2xl text-teal-600 mr-3" />
            <h3 className="text-lg font-semibold">Minh chứng chuyển phí</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Số tiền chuyển phí</p>
              <p className="text-lg font-bold text-teal-600">
                {(order as any)?.transportFee
                  ? `${(order as any).transportFee?.toLocaleString()} VNĐ`
                  : "Chưa có thông tin"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Hình thức thanh toán</p>
              <p className="text-lg font-semibold">
                {(order as any)?.paymentMethod || "Chưa có thông tin"}
              </p>
            </div>
          </div>
          {(order as any)?.transportFeeProof ? (
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-2">
                Hình ảnh minh chứng:
              </p>
              <img
                src={(order as any).transportFeeProof}
                alt="Minh chứng chuyển phí"
                className="max-w-xs h-48 object-cover rounded border cursor-pointer hover:opacity-80"
                onClick={() =>
                  window.open((order as any).transportFeeProof, "_blank")
                }
              />
            </div>
          ) : (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500">
                Chưa có hình ảnh minh chứng chuyển phí
              </p>
            </div>
          )}
        </Card>

        {/* Issues Information */}
        <Card className="shadow-md rounded-xl mb-6">
          <div className="flex items-center mb-4">
            <WarningOutlined className="text-2xl text-red-600 mr-3" />
            <h3 className="text-lg font-semibold">Thông tin sự cố</h3>
          </div>
          {(order as any)?.issues && (order as any).issues.length > 0 ? (
            <div className="space-y-4">
              {(order as any).issues.map((issue: any, index: number) => (
                <div
                  key={index}
                  className="border-l-4 border-red-500 bg-red-50 p-4 rounded"
                >
                  <div className="flex items-center mb-2">
                    <WarningOutlined className="text-red-600 mr-2" />
                    <p className="font-semibold text-red-800">
                      {issue.title || `Sự cố #${index + 1}`}
                    </p>
                  </div>
                  <p className="text-gray-700 mb-2">
                    {issue.description || "Không có mô tả"}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Thời gian: {issue.createdAt || "Chưa xác định"}</span>
                    <span
                      className={`px-2 py-1 rounded ${
                        issue.status === "RESOLVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {issue.status === "RESOLVED"
                        ? "Đã giải quyết"
                        : "Đang xử lý"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CheckCircleOutlined className="text-2xl text-green-600 mb-2" />
              <p className="text-green-700 font-medium">
                Không có sự cố nào được báo cáo
              </p>
            </div>
          )}
        </Card>
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
            name="supportedValue"
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
