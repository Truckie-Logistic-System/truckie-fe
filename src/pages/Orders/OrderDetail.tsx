import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  App,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Image,
  Empty,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined as ArrowLeft,
  CameraOutlined,
  TruckOutlined,
  WarningOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import orderService from "../../services/order/orderService";
import type { Order } from "../../models";
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


const { TabPane } = Tabs;

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageApi = App.useApp().message;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Lấy thông tin đơn hàng khi component mount
  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  // Hàm lấy thông tin chi tiết đơn hàng từ API
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

  // Xử lý khi click nút xóa đơn hàng
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

  // Xử lý khi click nút sửa đơn hàng
  const handleEdit = () => {
    if (!id) return;
    navigate(`/orders/${id}/edit`);
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
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <DollarOutlined className="text-blue-500 text-xl" />
            <Typography.Title level={4} className="mb-0">
              Thông tin cọc tiền
            </Typography.Title>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div className="border-l-4 border-blue-400 pl-4">
                <Typography.Text type="secondary">Số tiền cọc</Typography.Text>
                <div className="text-lg font-semibold text-blue-600">
                  {order.depositAmount
                    ? `${order.depositAmount.toLocaleString("vi-VN")} VNĐ`
                    : "Chưa có thông tin"}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="border-l-4 border-green-400 pl-4">
                <Typography.Text type="secondary">
                  Trạng thái thanh toán
                </Typography.Text>
                <div className="text-lg font-semibold">
                  <Tag
                    color={
                      order.depositStatus === "paid"
                        ? "green"
                        : order.depositStatus === "pending"
                        ? "orange"
                        : "gray"
                    }
                  >
                    {order.depositStatus === "paid"
                      ? "Đã thanh toán"
                      : order.depositStatus === "pending"
                      ? "Đang chờ"
                      : "Chưa có thông tin"}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="border-l-4 border-purple-400 pl-4">
                <Typography.Text type="secondary">
                  Ngày thanh toán
                </Typography.Text>
                <div className="text-lg font-semibold text-gray-700">
                  {order.depositPaidDate
                    ? new Date(order.depositPaidDate).toLocaleDateString(
                        "vi-VN"
                      )
                    : "Chưa có thông tin"}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Trip Information */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ArrowRightOutlined className="text-green-500 text-xl" />
            <Typography.Title level={4} className="mb-0">
              Thông tin lượt đi/về
            </Typography.Title>
          </div>
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRightOutlined className="text-blue-500" />
                  <Typography.Text strong className="text-blue-700">
                    Lượt đi
                  </Typography.Text>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Thời gian xuất phát:</span>
                    <span className="font-semibold">
                      {order.outboundDepartureTime
                        ? new Date(order.outboundDepartureTime).toLocaleString(
                            "vi-VN"
                          )
                        : "Chưa có thông tin"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian đến:</span>
                    <span className="font-semibold">
                      {order.outboundArrivalTime
                        ? new Date(order.outboundArrivalTime).toLocaleString(
                            "vi-VN"
                          )
                        : "Chưa có thông tin"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trạng thái:</span>
                    <Tag
                      color={
                        order.outboundStatus === "completed"
                          ? "green"
                          : order.outboundStatus === "in-progress"
                          ? "blue"
                          : "gray"
                      }
                    >
                      {order.outboundStatus === "completed"
                        ? "Hoàn thành"
                        : order.outboundStatus === "in-progress"
                        ? "Đang thực hiện"
                        : "Chưa có thông tin"}
                    </Tag>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowLeft className="text-orange-500" />
                  <Typography.Text strong className="text-orange-700">
                    Lượt về
                  </Typography.Text>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Thời gian xuất phát:</span>
                    <span className="font-semibold">
                      {order.returnDepartureTime
                        ? new Date(order.returnDepartureTime).toLocaleString(
                            "vi-VN"
                          )
                        : "Chưa có thông tin"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian đến:</span>
                    <span className="font-semibold">
                      {order.returnArrivalTime
                        ? new Date(order.returnArrivalTime).toLocaleString(
                            "vi-VN"
                          )
                        : "Chưa có thông tin"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trạng thái:</span>
                    <Tag
                      color={
                        order.returnStatus === "completed"
                          ? "green"
                          : order.returnStatus === "in-progress"
                          ? "blue"
                          : "gray"
                      }
                    >
                      {order.returnStatus === "completed"
                        ? "Hoàn thành"
                        : order.returnStatus === "in-progress"
                        ? "Đang thực hiện"
                        : "Chưa có thông tin"}
                    </Tag>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Delivery Proof Images */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CameraOutlined className="text-purple-500 text-xl" />
            <Typography.Title level={4} className="mb-0">
              Minh chứng hình ảnh giao hàng
            </Typography.Title>
          </div>
          {order.deliveryProofImages && order.deliveryProofImages.length > 0 ? (
            <Row gutter={[16, 16]}>
              {order.deliveryProofImages.map((image, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <Image
                      src={image.url}
                      alt={`Ảnh giao hàng ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                      placeholder={
                        <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                          <FileImageOutlined className="text-2xl text-gray-400" />
                        </div>
                      }
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      <div>
                        Thời gian:{" "}
                        {image.timestamp
                          ? new Date(image.timestamp).toLocaleString("vi-VN")
                          : "N/A"}
                      </div>
                      <div>Mô tả: {image.description || "Không có mô tả"}</div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có hình ảnh minh chứng giao hàng"
            />
          )}
        </Card>

        {/* Shipping Proof Documentation */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FileImageOutlined className="text-indigo-500 text-xl" />
            <Typography.Title level={4} className="mb-0">
              Minh chứng chuyển phí
            </Typography.Title>
          </div>
          {order.shippingProofDocuments &&
          order.shippingProofDocuments.length > 0 ? (
            <div className="space-y-4">
              {order.shippingProofDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <Row gutter={[16, 8]} align="middle">
                    <Col xs={24} sm={12}>
                      <div className="flex items-center gap-3">
                        <FileImageOutlined className="text-indigo-500 text-lg" />
                        <div>
                          <div className="font-semibold">
                            {doc.fileName || "Tài liệu chuyển phí"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Tải lên:{" "}
                            {doc.uploadDate
                              ? new Date(doc.uploadDate).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Tag color="blue">{doc.documentType || "Tài liệu"}</Tag>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Button
                        type="link"
                        onClick={() => window.open(doc.url, "_blank")}
                        disabled={!doc.url}
                      >
                        Xem
                      </Button>
                    </Col>
                  </Row>
                  {doc.description && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <Typography.Text type="secondary">
                        {doc.description}
                      </Typography.Text>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có minh chứng chuyển phí"
            />
          )}
        </Card>
        {/* Detailed Vehicle Assignment */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TruckOutlined className="text-blue-500 text-xl" />
            <Typography.Title level={4} className="mb-0">
              Chuyển xe nhận đơn
            </Typography.Title>
          </div>
          {order.orderDetails &&
          order.orderDetails.length > 0 &&
          order.orderDetails[0].vehicleAssignmentId ? (
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Typography.Text strong className="text-blue-700">
                      Thông tin xe
                    </Typography.Text>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Biển số xe:</span>
                        <span className="font-semibold">
                          {order.orderDetails[0].vehicleAssignmentId.vehicle
                            ?.licensePlate || "Chưa có thông tin"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loại xe:</span>
                        <span className="font-semibold">
                          {order.orderDetails[0].vehicleAssignmentId.vehicle
                            ?.vehicleType || "Chưa có thông tin"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trọng tải:</span>
                        <span className="font-semibold">
                          {order.orderDetails[0].vehicleAssignmentId.vehicle
                            ?.capacity || "Chưa có thông tin"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Typography.Text strong className="text-green-700">
                      Thông tin tài xế
                    </Typography.Text>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Tên tài xế:</span>
                        <span className="font-semibold">
                          {order.orderDetails[0].vehicleAssignmentId.driver
                            ?.fullName || "Chưa có thông tin"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Số điện thoại:</span>
                        <span className="font-semibold">
                          {order.orderDetails[0].vehicleAssignmentId.driver
                            ?.phoneNumber || "Chưa có thông tin"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kinh nghiệm:</span>
                        <span className="font-semibold">
                          {order.orderDetails[0].vehicleAssignmentId.driver
                            ?.experience || "Chưa có thông tin"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              <Divider />
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={8}>
                  <div className="text-center">
                    <Typography.Text type="secondary">
                      Ngày phân công
                    </Typography.Text>
                    <div className="font-semibold">
                      {order.orderDetails[0].vehicleAssignmentId.assignedDate
                        ? new Date(
                            order.orderDetails[0].vehicleAssignmentId.assignedDate
                          ).toLocaleDateString("vi-VN")
                        : "Chưa có thông tin"}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="text-center">
                    <Typography.Text type="secondary">
                      Trạng thái
                    </Typography.Text>
                    <div>
                      <Tag
                        color={
                          order.orderDetails[0].vehicleAssignmentId.status ===
                          "assigned"
                            ? "blue"
                            : order.orderDetails[0].vehicleAssignmentId
                                .status === "in-transit"
                            ? "orange"
                            : order.orderDetails[0].vehicleAssignmentId
                                .status === "completed"
                            ? "green"
                            : "gray"
                        }
                      >
                        {order.orderDetails[0].vehicleAssignmentId.status ===
                        "assigned"
                          ? "Đã phân công"
                          : order.orderDetails[0].vehicleAssignmentId.status ===
                            "in-transit"
                          ? "Đang vận chuyển"
                          : order.orderDetails[0].vehicleAssignmentId.status ===
                            "completed"
                          ? "Hoàn thành"
                          : "Chưa có thông tin"}
                      </Tag>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="text-center">
                    <Typography.Text type="secondary">Ưu tiên</Typography.Text>
                    <div>
                      <Tag
                        color={
                          order.orderDetails[0].vehicleAssignmentId.priority ===
                          "high"
                            ? "red"
                            : order.orderDetails[0].vehicleAssignmentId
                                .priority === "medium"
                            ? "orange"
                            : "green"
                        }
                      >
                        {order.orderDetails[0].vehicleAssignmentId.priority ===
                        "high"
                          ? "Cao"
                          : order.orderDetails[0].vehicleAssignmentId
                              .priority === "medium"
                          ? "Trung bình"
                          : order.orderDetails[0].vehicleAssignmentId
                              .priority === "low"
                          ? "Thấp"
                          : "Chưa có thông tin"}
                      </Tag>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có thông tin phân công xe"
            />
          )}
        </Card>

        {/* Incident Reports */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <WarningOutlined className="text-red-500 text-xl" />
            <Typography.Title level={4} className="mb-0">
              Sự cố
            </Typography.Title>
          </div>
          {order.incidents && order.incidents.length > 0 ? (
            <div className="space-y-4">
              {order.incidents.map((incident, index) => (
                <div
                  key={index}
                  className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg"
                >
                  <Row gutter={[16, 8]}>
                    <Col xs={24} sm={16}>
                      <div className="flex items-center gap-2 mb-2">
                        <WarningOutlined className="text-red-500" />
                        <Typography.Text strong className="text-red-700">
                          {incident.incidentType || "Sự cố không xác định"}
                        </Typography.Text>
                      </div>
                      <Typography.Text>
                        {incident.description || "Không có mô tả chi tiết"}
                      </Typography.Text>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div className="text-right">
                        <div className="mb-1">
                          <Tag
                            color={
                              incident.severity === "high"
                                ? "red"
                                : incident.severity === "medium"
                                ? "orange"
                                : "yellow"
                            }
                          >
                            {incident.severity === "high"
                              ? "Nghiêm trọng"
                              : incident.severity === "medium"
                              ? "Trung bình"
                              : incident.severity === "low"
                              ? "Nhẹ"
                              : "Chưa xác định"}
                          </Tag>
                        </div>
                        <div className="text-sm text-gray-600">
                          {incident.reportedDate
                            ? new Date(incident.reportedDate).toLocaleString(
                                "vi-VN"
                              )
                            : "Chưa có thông tin"}
                        </div>
                      </div>
                    </Col>
                  </Row>
                  {incident.resolution && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <Typography.Text strong>Giải pháp: </Typography.Text>
                      <Typography.Text>{incident.resolution}</Typography.Text>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <WarningOutlined className="text-2xl text-green-600" />
              </div>
              <Typography.Title level={5} className="text-green-700 mb-2">
                Không có sự cố
              </Typography.Title>
              <Typography.Text type="secondary">
                Đơn hàng được vận chuyển an toàn, không có sự cố nào được báo
                cáo.
              </Typography.Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OrderDetailPage;
