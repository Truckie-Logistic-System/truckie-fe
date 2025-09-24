import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  App,
  Button,
  Typography,
  Skeleton,
  Empty,
  Tabs,
  Card,
  Descriptions,
  Tag,
  Timeline,
  Image,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  IdcardOutlined,
  CarOutlined,
  BoxPlotOutlined,
  ToolOutlined,
  HistoryOutlined,
  CameraOutlined,
  ProfileOutlined,
  CreditCardOutlined,
  HomeOutlined,
  NumberOutlined,
  ColumnWidthOutlined,
  TagOutlined,
  UserOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import orderService from "../../../services/order/orderService";
import type { CustomerOrderDetailResponse } from "../../../services/order/types";
import OrderStatusSection from "./CustomerOrderDetail/OrderStatusSection";
import AddressSection from "./CustomerOrderDetail/AddressSection";
import ContractSection from "./CustomerOrderDetail/ContractSection";
import TransactionSection from "./CustomerOrderDetail/TransactionSection";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;
const { TabPane } = Tabs;

const CustomerOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageApi = App.useApp().message;
  const [orderData, setOrderData] = useState<
    CustomerOrderDetailResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMainTab, setActiveMainTab] = useState<string>("basic");
  const [activeDetailTab, setActiveDetailTab] = useState<string>("0");

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const fetchOrderDetails = async (orderId: string) => {
    setLoading(true);
    try {
      const data = await orderService.getOrderForCustomerByOrderId(orderId);
      setOrderData(data);
    } catch (error) {
      messageApi.error("Không thể tải thông tin đơn hàng");
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có thông tin";
    return dayjs(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "orange",
      PROCESSING: "blue",
      CANCELLED: "red",
      DELIVERED: "green",
      SUCCESSFUL: "green",
      IN_TROUBLES: "red",
      // Add more status mappings as needed
    };
    return statusMap[status] || "default";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/orders")}
            className="mr-4"
          >
            Quay lại
          </Button>
          <Skeleton.Input style={{ width: 300 }} active />
        </div>
        <Skeleton active paragraph={{ rows: 6 }} />
        <Skeleton active paragraph={{ rows: 6 }} className="mt-6" />
        <Skeleton active paragraph={{ rows: 6 }} className="mt-6" />
      </div>
    );
  }

  if (!orderData || !orderData.order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/orders")}
            className="mr-4"
          >
            Quay lại
          </Button>
          <Title level={3}>Chi tiết đơn hàng</Title>
        </div>
        <Empty
          description="Không tìm thấy thông tin đơn hàng"
          className="bg-white p-8 rounded-xl shadow-md"
        />
      </div>
    );
  }

  const { order, contract, transactions } = orderData;

  // Tab 1: Thông tin cơ bản
  const renderBasicInfoTab = () => {
    return (
      <div>
        {/* Order Status */}
        <OrderStatusSection
          orderCode={order.orderCode}
          status={order.status}
          createdAt={order.createdAt}
          totalPrice={order.totalPrice}
        />

        {/* Address and Contact Information */}
        <AddressSection
          pickupAddress={order.pickupAddress}
          deliveryAddress={order.deliveryAddress}
          senderName={order.senderName}
          senderPhone={order.senderPhone}
          senderCompanyName={order.senderCompanyName}
          receiverName={order.receiverName}
          receiverPhone={order.receiverPhone}
          receiverIdentity={order.receiverIdentity}
        />

        {/* Order Information */}
        <Card className="mb-6 shadow-md rounded-xl">
          <Title level={4} className="mb-4">
            Thông tin đơn hàng
          </Title>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-2">
              <span className="font-medium">Mô tả:</span>{" "}
              {order.packageDescription || "Không có mô tả"}
            </p>
            <p className="mb-2">
              <span className="font-medium">Số lượng:</span>{" "}
              {order.totalQuantity}
            </p>
            <p className="mb-0">
              <span className="font-medium">Loại hàng:</span>{" "}
              {order.categoryName || "Chưa phân loại"}
            </p>
          </div>

          {order.notes && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2 text-gray-700 flex items-center">
                <InfoCircleOutlined className="mr-2 text-blue-500" /> Ghi chú
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-0">{order.notes}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // Tab 2: Chi tiết vận chuyển
  const renderOrderDetailTab = () => {
    if (!order.orderDetails || order.orderDetails.length === 0) {
      return <Empty description="Chưa có thông tin chi tiết vận chuyển" />;
    }

    // Kiểm tra xem đơn hàng đã được phân công cho tài xế chưa
    const isAssignedToDriver = order.status === "ASSIGNED_TO_DRIVER" ||
      order.status === "DRIVER_CONFIRM" ||
      order.status === "PICKED_UP" ||
      order.status === "SEALED_COMPLETED" ||
      order.status === "ON_DELIVERED" ||
      order.status === "ONGOING_DELIVERED" ||
      order.status === "IN_DELIVERED";

    // Nếu đã phân công cho tài xế, hiển thị theo vehicle assignment
    if (isAssignedToDriver) {
      // Nhóm các order details theo vehicle assignment
      interface VehicleAssignmentGroup {
        vehicleAssignment: any;
        orderDetails: any[];
      }

      const vehicleAssignmentMap = new Map<string, VehicleAssignmentGroup>();

      order.orderDetails.forEach(detail => {
        if (detail.vehicleAssignment) {
          const vaId = detail.vehicleAssignment.id;
          if (!vehicleAssignmentMap.has(vaId)) {
            vehicleAssignmentMap.set(vaId, {
              vehicleAssignment: detail.vehicleAssignment,
              orderDetails: []
            });
          }
          vehicleAssignmentMap.get(vaId)?.orderDetails.push(detail);
        }
      });

      const vehicleAssignments = Array.from(vehicleAssignmentMap.values());

      if (vehicleAssignments.length === 0) {
        return <Empty description="Chưa có thông tin phân công xe" />;
      }

      return (
        <Tabs
          activeKey={activeDetailTab}
          onChange={setActiveDetailTab}
          type="card"
          className="order-detail-tabs"
        >
          {vehicleAssignments.map((vaGroup, index) => (
            <TabPane
              tab={
                <span>
                  <CarOutlined /> Chuyến xe #{index + 1} - {vaGroup.vehicleAssignment.trackingCode || "Chưa có mã"}
                </span>
              }
              key={index.toString()}
            >
              {/* Thông tin cơ bản của phương tiện */}
              <Card className="mb-6 shadow-md rounded-xl">
                <Title level={5} className="mb-4 flex items-center">
                  <CarOutlined className="mr-2 text-blue-500" />
                  <span>Thông tin phương tiện</span>
                </Title>
                <div className="p-2">
                  <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <CarOutlined className="text-xl text-blue-500 mr-3" />
                      <span className="text-lg font-medium">{vaGroup.vehicleAssignment.licensePlateNumber || "Chưa có thông tin"}</span>
                      <Tag className="ml-3" color={getStatusColor(vaGroup.vehicleAssignment.status || "")}>
                        {vaGroup.vehicleAssignment.status}
                      </Tag>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center">
                        <InfoCircleOutlined className="mr-2 text-gray-500" />
                        <span className="font-medium mr-1">Tên phương tiện:</span>
                        <span>{vaGroup.vehicleAssignment.vehicleName || "Chưa có thông tin"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <UserOutlined className="text-green-500 mr-2" />
                        <span className="font-medium">Tài xế chính</span>
                      </div>
                      {vaGroup.vehicleAssignment.primaryDriver ? (
                        <div className="ml-6">
                          <div className="flex items-center mb-1">
                            <UserOutlined className="mr-2 text-gray-500" />
                            <span>{vaGroup.vehicleAssignment.primaryDriver.fullName}</span>
                          </div>
                          <div className="flex items-center">
                            <PhoneOutlined className="mr-2 text-gray-500" />
                            <span>{vaGroup.vehicleAssignment.primaryDriver.phoneNumber}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                      )}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <UserOutlined className="text-blue-500 mr-2" />
                        <span className="font-medium">Tài xế phụ</span>
                      </div>
                      {vaGroup.vehicleAssignment.secondaryDriver ? (
                        <div className="ml-6">
                          <div className="flex items-center mb-1">
                            <UserOutlined className="mr-2 text-gray-500" />
                            <span>{vaGroup.vehicleAssignment.secondaryDriver.fullName}</span>
                          </div>
                          <div className="flex items-center">
                            <PhoneOutlined className="mr-2 text-gray-500" />
                            <span>{vaGroup.vehicleAssignment.secondaryDriver.phoneNumber}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tabs cho các thông tin chi tiết */}
              <Card className="mb-6 shadow-md rounded-xl">
                <Tabs defaultActiveKey="orderDetails" type="card">
                  {/* Tab danh sách lô hàng */}
                  <TabPane
                    tab={
                      <span>
                        <BoxPlotOutlined /> Danh sách lô hàng
                      </span>
                    }
                    key="orderDetails"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                              Mã theo dõi
                            </th>
                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                              Trạng thái
                            </th>
                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                              Trọng lượng
                            </th>
                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                              Mô tả
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {vaGroup.orderDetails.map((detail, detailIndex) => (
                            <tr key={detail.id}>
                              <td className="border border-gray-300 p-2">
                                <div className="flex items-center">
                                  <NumberOutlined className="mr-2 text-blue-500" />
                                  {detail.trackingCode || "Chưa có"}
                                </div>
                              </td>
                              <td className="border border-gray-300 p-2">
                                <Tag color={
                                  detail.status === "PENDING" ? "orange" :
                                    detail.status === "PROCESSING" ? "blue" :
                                      detail.status === "DELIVERED" || detail.status === "SUCCESSFUL" ? "green" :
                                        detail.status === "CANCELLED" || detail.status === "IN_TROUBLES" ? "red" :
                                          "default"
                                }>
                                  {detail.status}
                                </Tag>
                              </td>
                              <td className="border border-gray-300 p-2">
                                <div className="flex items-center">
                                  <ColumnWidthOutlined className="mr-2 text-blue-500" />
                                  {detail.weightBaseUnit} {detail.unit}
                                </div>
                              </td>
                              <td className="border border-gray-300 p-2">
                                <div className="flex items-center">
                                  <FileTextOutlined className="mr-2 text-blue-500" />
                                  {detail.description || "Không có mô tả"}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabPane>

                  {/* Tab lịch sử hành trình */}
                  <TabPane
                    tab={
                      <span>
                        <HistoryOutlined /> Lịch sử hành trình
                      </span>
                    }
                    key="journey"
                  >
                    {vaGroup.vehicleAssignment.journeyHistory && vaGroup.vehicleAssignment.journeyHistory.length > 0 ? (
                      <Timeline
                        mode="left"
                        items={vaGroup.vehicleAssignment.journeyHistory.map((journey: any) => ({
                          label: formatDate(journey.startTime),
                          children: (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="flex items-center mb-2">
                                <TagOutlined className="mr-2 text-blue-500" />
                                <span className="font-medium mr-1">Trạng thái:</span>
                                <Tag color={
                                  journey.status === "COMPLETED" ? "green" :
                                    journey.status === "IN_PROGRESS" ? "blue" : "orange"
                                }>
                                  {journey.status}
                                </Tag>
                              </div>
                              <div className="flex items-center mb-2">
                                <ClockCircleOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Thời gian kết thúc:</span>
                                <span>{formatDate(journey.endTime)}</span>
                              </div>
                              <div className="flex items-center">
                                <DashboardOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Tổng quãng đường:</span>
                                <span>{journey.totalDistance} km</span>
                              </div>
                              {journey.isReportedIncident && (
                                <div className="mt-2">
                                  <Tag color="red" icon={<ToolOutlined />}>Có báo cáo sự cố</Tag>
                                </div>
                              )}
                            </div>
                          ),
                        }))}
                      />
                    ) : (
                      <Empty description="Không có lịch sử hành trình nào" />
                    )}
                  </TabPane>

                  {/* Tab hình ảnh hoàn thành */}
                  <TabPane
                    tab={
                      <span>
                        <CameraOutlined /> Hình ảnh hoàn thành
                      </span>
                    }
                    key="photos"
                  >
                    {vaGroup.vehicleAssignment.photoCompletions && vaGroup.vehicleAssignment.photoCompletions.length > 0 ? (
                      <div className="p-2">
                        <div className="flex items-center mb-3">
                          <CameraOutlined className="mr-2 text-blue-500" />
                          <span className="font-medium">Hình ảnh hoàn thành:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {vaGroup.vehicleAssignment.photoCompletions.map(
                            (url: string, idx: number) => (
                              <Image
                                key={idx}
                                src={url}
                                alt={`Completion photo ${idx + 1}`}
                                width={100}
                                height={100}
                                className="object-cover rounded"
                              />
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <Empty description="Không có hình ảnh hoàn thành" />
                    )}
                  </TabPane>

                  {/* Tab sự cố */}
                  <TabPane
                    tab={
                      <span>
                        <ToolOutlined /> Sự cố
                      </span>
                    }
                    key="issues"
                  >
                    {vaGroup.vehicleAssignment.issue ? (
                      <div className="p-2">
                        <div className="bg-red-50 p-4 rounded-lg mb-3">
                          <div className="flex items-center mb-3">
                            <ToolOutlined className="text-red-500 mr-2" />
                            <span className="font-medium">Mô tả sự cố:</span>
                            <span className="ml-2">{vaGroup.vehicleAssignment.issue.issue.description}</span>
                            <Tag className="ml-2" color={getStatusColor(vaGroup.vehicleAssignment.issue.issue.status)}>
                              {vaGroup.vehicleAssignment.issue.issue.status}
                            </Tag>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center">
                              <TagOutlined className="mr-2 text-gray-500" />
                              <span className="font-medium mr-1">Loại sự cố:</span>
                              <span>{vaGroup.vehicleAssignment.issue.issue.issueTypeName}</span>
                            </div>
                            <div className="flex items-center">
                              <UserOutlined className="mr-2 text-gray-500" />
                              <span className="font-medium mr-1">Nhân viên xử lý:</span>
                              <span>{vaGroup.vehicleAssignment.issue.issue.staff.name}</span>
                            </div>
                            <div className="flex items-center">
                              <PhoneOutlined className="mr-2 text-gray-500" />
                              <span className="font-medium mr-1">Liên hệ:</span>
                              <span>{vaGroup.vehicleAssignment.issue.issue.staff.phone}</span>
                            </div>
                          </div>
                        </div>

                        {vaGroup.vehicleAssignment.issue.imageUrls &&
                          vaGroup.vehicleAssignment.issue.imageUrls.length > 0 ? (
                          <div className="mt-4">
                            <div className="flex items-center mb-2">
                              <CameraOutlined className="mr-2 text-blue-500" />
                              <span className="font-medium">Hình ảnh:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {vaGroup.vehicleAssignment.issue.imageUrls.map(
                                (url: string, idx: number) => (
                                  <Image
                                    key={idx}
                                    src={url}
                                    alt={`Issue image ${idx + 1}`}
                                    width={100}
                                    height={100}
                                    className="object-cover rounded"
                                  />
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 text-gray-500">
                            <CameraOutlined className="mr-2" />
                            <span>Chưa có hình ảnh</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Empty description="Không có sự cố nào được ghi nhận" />
                    )}
                  </TabPane>

                  {/* Tab niêm phong */}
                  <TabPane
                    tab={
                      <span>
                        <FileTextOutlined /> Niêm phong
                      </span>
                    }
                    key="seals"
                  >
                    {vaGroup.vehicleAssignment.orderSeals && vaGroup.vehicleAssignment.orderSeals.length > 0 ? (
                      <div className="p-2">
                        {vaGroup.vehicleAssignment.orderSeals.map((seal: any, sealIdx: number) => (
                          <div key={seal.id} className={`${sealIdx > 0 ? "mt-3" : ""} bg-gray-50 p-4 rounded-lg`}>
                            <div className="flex items-center mb-2">
                              <FileTextOutlined className="mr-2 text-blue-500" />
                              <span className="font-medium mr-1">Mô tả:</span>
                              <span>{seal.description}</span>
                            </div>
                            <div className="flex items-center mb-2">
                              <CalendarOutlined className="mr-2 text-gray-500" />
                              <span className="font-medium mr-1">Ngày niêm phong:</span>
                              <span>{formatDate(seal.sealDate)}</span>
                            </div>
                            <div className="flex items-center">
                              <TagOutlined className="mr-2 text-gray-500" />
                              <span className="font-medium mr-1">Trạng thái:</span>
                              <Tag color={getStatusColor(seal.status)}>
                                {seal.status}
                              </Tag>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty description="Không có thông tin niêm phong" />
                    )}
                  </TabPane>
                </Tabs>
              </Card>
            </TabPane>
          ))}
        </Tabs>
      );
    }

    // Nếu chưa phân công, hiển thị theo từng order detail như cũ
    return (
      <Tabs
        activeKey={activeDetailTab}
        onChange={setActiveDetailTab}
        type="card"
        className="order-detail-tabs"
      >
        {order.orderDetails.map((detail, index) => (
          <TabPane
            tab={
              <span>
                <BoxPlotOutlined /> Kiện {index + 1}{" "}
                {detail.trackingCode ? `- ${detail.trackingCode} ` : ""}
              </span>
            }
            key={index.toString()}
          >
            {/* Thông tin chi tiết vận chuyển */}
            <Card className="mb-6 shadow-md rounded-xl">
              <Title level={5} className="mb-4">
                Thông tin chi tiết vận chuyển
              </Title>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                      <FileTextOutlined className="mr-2 text-blue-500" /> Thông
                      tin cơ bản
                    </h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                            Thông tin
                          </th>
                          <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                            Chi tiết
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Mã theo dõi
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.trackingCode || "Chưa có"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Trạng thái
                          </td>
                          <td className="border border-gray-300 p-2">
                            <span
                              className={`px-2 py-1 rounded text-white bg-${detail.status === "PENDING"
                                ? "orange-500"
                                : detail.status === "PROCESSING"
                                  ? "blue-500"
                                  : detail.status === "DELIVERED" ||
                                    detail.status === "SUCCESSFUL"
                                    ? "green-500"
                                    : detail.status === "CANCELLED" ||
                                      detail.status === "IN_TROUBLES"
                                      ? "red-500"
                                      : "gray-500"
                                }`}
                            >
                              {detail.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Trọng lượng
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.weightBaseUnit} {detail.unit}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Mô tả</td>
                          <td className="border border-gray-300 p-2">
                            {detail.description || "Không có mô tả"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                      <HistoryOutlined className="mr-2 text-blue-500" /> Thông
                      tin thời gian
                    </h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                            Thời gian
                          </th>
                          <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                            Ngày giờ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Thời gian bắt đầu
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.startTime
                              ? new Date(detail.startTime).toLocaleString(
                                "vi-VN"
                              )
                              : "Chưa có thông tin"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Thời gian kết thúc
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.endTime
                              ? new Date(detail.endTime).toLocaleString("vi-VN")
                              : "Chưa có thông tin"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Thời gian dự kiến bắt đầu
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.estimatedStartTime
                              ? new Date(
                                detail.estimatedStartTime
                              ).toLocaleString("vi-VN")
                              : "Chưa có thông tin"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Thời gian dự kiến kết thúc
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.estimatedEndTime
                              ? new Date(
                                detail.estimatedEndTime
                              ).toLocaleString("vi-VN")
                              : "Chưa có thông tin"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Thông tin kích thước */}
            {detail.orderSize && (
              <Card className="mb-6 shadow-md rounded-xl">
                <Title level={5} className="mb-4">
                  Thông tin kích thước
                </Title>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                        Mô tả
                      </th>
                      <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                        Kích thước (Dài x Rộng x Cao)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">
                        {detail.orderSize.description}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {`${detail.orderSize.minLength} x ${detail.orderSize.minWidth} x ${detail.orderSize.minHeight} m - 
                                                ${detail.orderSize.maxLength} x ${detail.orderSize.maxWidth} x ${detail.orderSize.maxHeight} m`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            )}

            {/* Thông tin chuyến xe */}
            <Card className="mb-6 shadow-md rounded-xl">
              <Title level={5} className="mb-4">
                Thông tin chuyến xe
              </Title>

              {detail.vehicleAssignment ? (
                <Tabs defaultActiveKey="vehicle" type="card">
                  <TabPane
                    tab={
                      <span>
                        <CarOutlined /> Thông tin phương tiện
                      </span>
                    }
                    key="vehicle"
                  >
                    <table className="w-full border-collapse mb-4">
                      <thead>
                        <tr>
                          <th
                            className="border border-gray-300 bg-gray-50 p-2 text-left"
                            colSpan={2}
                          >
                            Thông tin xe
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 w-1/3">
                            Tên phương tiện
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.vehicleAssignment.vehicleName ||
                              "Chưa có thông tin"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Biển số xe
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.vehicleAssignment.licensePlateNumber ||
                              "Chưa có thông tin"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Trạng thái
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.vehicleAssignment.status ? (
                              <Tag
                                color={getStatusColor(
                                  detail.vehicleAssignment.status
                                )}
                              >
                                {detail.vehicleAssignment.status}
                              </Tag>
                            ) : (
                              "Chưa có thông tin"
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th
                            className="border border-gray-300 bg-gray-50 p-2 text-left"
                            colSpan={2}
                          >
                            Thông tin tài xế
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 w-1/3">
                            Tài xế chính
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.vehicleAssignment.primaryDriver
                              ? detail.vehicleAssignment.primaryDriver.fullName
                              : "Chưa có thông tin"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            SĐT tài xế chính
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.vehicleAssignment.primaryDriver
                              ? detail.vehicleAssignment.primaryDriver
                                .phoneNumber
                              : "Chưa có thông tin"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Tài xế phụ
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.vehicleAssignment.secondaryDriver
                              ? detail.vehicleAssignment.secondaryDriver
                                .fullName
                              : "Chưa có thông tin"}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            SĐT tài xế phụ
                          </td>
                          <td className="border border-gray-300 p-2">
                            {detail.vehicleAssignment.secondaryDriver
                              ? detail.vehicleAssignment.secondaryDriver
                                .phoneNumber
                              : "Chưa có thông tin"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </TabPane>

                  {detail.vehicleAssignment.issue && (
                    <TabPane
                      tab={
                        <span>
                          <ToolOutlined /> Sự cố
                        </span>
                      }
                      key="issues"
                    >
                      <div>
                        <table className="w-full border-collapse mb-4">
                          <thead>
                            <tr>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Thông tin
                              </th>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Chi tiết
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-2">
                                Mô tả
                              </td>
                              <td className="border border-gray-300 p-2">
                                {
                                  detail.vehicleAssignment.issue.issue
                                    .description
                                }
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">
                                Trạng thái
                              </td>
                              <td className="border border-gray-300 p-2">
                                <Tag
                                  color={getStatusColor(
                                    detail.vehicleAssignment.issue.issue.status
                                  )}
                                >
                                  {detail.vehicleAssignment.issue.issue.status}
                                </Tag>
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">
                                Loại sự cố
                              </td>
                              <td className="border border-gray-300 p-2">
                                {
                                  detail.vehicleAssignment.issue.issue
                                    .issueTypeName
                                }
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">
                                Nhân viên xử lý
                              </td>
                              <td className="border border-gray-300 p-2">
                                {
                                  detail.vehicleAssignment.issue.issue.staff
                                    .name
                                }{" "}
                                (
                                {
                                  detail.vehicleAssignment.issue.issue.staff
                                    .phone
                                }
                                )
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {detail.vehicleAssignment.issue.imageUrls &&
                          detail.vehicleAssignment.issue.imageUrls.length > 0 ? (
                          <div className="mt-4">
                            <p className="font-medium mb-2">Hình ảnh:</p>
                            <div className="flex flex-wrap gap-2">
                              {detail.vehicleAssignment.issue.imageUrls.map(
                                (url: string, idx: number) => (
                                  <Image
                                    key={idx}
                                    src={url}
                                    alt={`Issue image ${idx + 1}`}
                                    width={100}
                                    height={100}
                                    className="object-cover rounded"
                                  />
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 mb-0">
                            <span className="font-medium">Hình ảnh:</span> Chưa
                            có hình ảnh
                          </p>
                        )}
                      </div>
                    </TabPane>
                  )}

                  {detail.vehicleAssignment.journeyHistory &&
                    detail.vehicleAssignment.journeyHistory.length > 0 && (
                      <TabPane
                        tab={
                          <span>
                            <HistoryOutlined /> Lịch sử hành trình
                          </span>
                        }
                        key="journey"
                      >
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Thời gian bắt đầu
                              </th>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Thời gian kết thúc
                              </th>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Trạng thái
                              </th>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Quãng đường
                              </th>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Báo cáo sự cố
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.vehicleAssignment.journeyHistory.map(
                              (journey, idx) => (
                                <tr key={journey.id}>
                                  <td className="border border-gray-300 p-2">
                                    {formatDate(journey.startTime)}
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {formatDate(journey.endTime)}
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {journey.status}
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {journey.totalDistance} km
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {journey.isReportedIncident ? (
                                      <Tag color="red">Có</Tag>
                                    ) : (
                                      <Tag color="green">Không</Tag>
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </TabPane>
                    )}

                  {detail.vehicleAssignment.orderSeals &&
                    detail.vehicleAssignment.orderSeals.length > 0 && (
                      <TabPane
                        tab={
                          <span>
                            <FileTextOutlined /> Niêm phong
                          </span>
                        }
                        key="seals"
                      >
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Mô tả
                              </th>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Ngày niêm phong
                              </th>
                              <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                Trạng thái
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.vehicleAssignment.orderSeals.map((seal) => (
                              <tr key={seal.id}>
                                <td className="border border-gray-300 p-2">
                                  {seal.description}
                                </td>
                                <td className="border border-gray-300 p-2">
                                  {formatDate(seal.sealDate)}
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Tag color={getStatusColor(seal.status)}>
                                    {seal.status}
                                  </Tag>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TabPane>
                    )}

                  {detail.vehicleAssignment.photoCompletions &&
                    detail.vehicleAssignment.photoCompletions.length > 0 && (
                      <TabPane
                        tab={
                          <span>
                            <CameraOutlined /> Hình ảnh hoàn thành
                          </span>
                        }
                        key="photos"
                      >
                        <div className="flex flex-wrap gap-2">
                          {detail.vehicleAssignment.photoCompletions.map(
                            (url, idx) => (
                              <Image
                                key={idx}
                                src={url}
                                alt={`Completion photo ${idx + 1}`}
                                width={100}
                                height={100}
                                className="object-cover rounded"
                              />
                            )
                          )}
                        </div>
                      </TabPane>
                    )}
                </Tabs>
              ) : (
                <div className="text-center py-8">
                  <Empty
                    description={
                      <div>
                        <p className="text-gray-500 mb-2">
                          Chưa có Thông tin chuyến xe
                        </p>
                        <p className="text-gray-400 text-sm">
                          Đơn hàng sẽ được gán phương tiện vận chuyển trong thời
                          gian tới
                        </p>
                      </div>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              )}
            </Card>
          </TabPane>
        ))}
      </Tabs>
    );
  };

  // Tab 3: Hợp đồng và thanh toán
  const renderContractAndPaymentTab = () => {
    return (
      <div>
        {/* Contract Information */}
        <ContractSection contract={contract} />

        {/* Transaction Information */}
        <TransactionSection transactions={transactions} />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/orders")}
          className="mr-4"
        >
          Quay lại
        </Button>
        <Title level={3}>Chi tiết đơn hàng {order.orderCode}</Title>
      </div>

      <Card className="mb-6 shadow-md rounded-xl">
        <Tabs
          activeKey={activeMainTab}
          onChange={setActiveMainTab}
          type="card"
          size="large"
          className="order-main-tabs"
        >
          <TabPane
            tab={
              <span className="px-2 py-1">
                <InfoCircleOutlined className="mr-2" /> Thông tin cơ bản
              </span>
            }
            key="basic"
          >
            {renderBasicInfoTab()}
          </TabPane>
          <TabPane
            tab={
              <span className="px-2 py-1">
                <CarOutlined className="mr-2" /> Chi tiết vận chuyển
              </span>
            }
            key="details"
          >
            {renderOrderDetailTab()}
          </TabPane>
          <TabPane
            tab={
              <span className="px-2 py-1">
                <ProfileOutlined className="mr-2" /> Hợp đồng & Thanh toán
              </span>
            }
            key="contract"
          >
            {renderContractAndPaymentTab()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default CustomerOrderDetail;
