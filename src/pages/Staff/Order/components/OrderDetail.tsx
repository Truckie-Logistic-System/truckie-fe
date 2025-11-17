import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  App,
  Tabs,
  Timeline,
  Card,
  Steps,
  Form,
  Input,
  DatePicker,
  InputNumber,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CarOutlined,
  HistoryOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useStaffOrderDetail } from "@/hooks";
import { useOrderStatusTracking } from "@/hooks/useOrderStatusTracking";
import { createOrderStatusChangeHandler } from "@/utils/orderStatusNotifications";
import orderService from "@/services/order/orderService";
import { contractService } from "@/services/contract";
import type { CreateContractRequest } from "@/services/contract/types";
import type { ContractData } from "@/services/contract/contractTypes";
import { OrderStatusEnum } from "@/constants/enums";

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
  StaffContractPreview,
} from "@/components/features/order";
import OrderStatusBreakdown from "@/components/common/OrderStatusBreakdown";

const { TabPane } = Tabs;

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageApi = App.useApp().message;
  
  // Use hook for order data management
  const { order, priceDetails, loading, refetch } = useStaffOrderDetail();
  const [activeTab, setActiveTab] = useState<string>("info");
  const [assigningVehicle, setAssigningVehicle] = useState<boolean>(false);
  const [contractModalVisible, setContractModalVisible] =
    useState<boolean>(false);
  const [contractPreviewVisible, setContractPreviewVisible] =
    useState<boolean>(false);
  const [contractForm] = Form.useForm();
  const [creatingContract, setCreatingContract] = useState<boolean>(false);
  const [contractData, setContractData] = useState<ContractData | null>(priceDetails || null);
  const [loadingContractData, setLoadingContractData] = useState<boolean>(false);
  
  // Update contractData when priceDetails from hook changes
  useEffect(() => {
    if (priceDetails) {
      setContractData(priceDetails);
    }
  }, [priceDetails]);

  // Tự động load contract data khi order status là CONTRACT_DRAFT
  useEffect(() => {
    console.log(
      "Order status:",
      order?.status,
      "ID:",
      id,
      "Contract data:",
      contractData
    );
    if (order?.status === "CONTRACT_DRAFT") {
      // Tự động chuyển sang tab contract
      if (activeTab !== "contract") {
        setActiveTab("contract");
      }
      // Tự động load contract data nếu chưa có
      if (id && !contractData && !loadingContractData) {
        console.log("Auto-loading contract data...");
        handlePreviewContract();
      }
    }
  }, [order?.status, id, contractData, activeTab, loadingContractData]);

  // fetchOrderDetails is now handled by useStaffOrderDetail hook

  // Xử lý khi click nút cập nhật trạng thái
  const handleUpdateStatus = (status: string) => {
    if (!id) return;
    messageApi.info(`Đã cập nhật trạng thái đơn hàng thành: ${status}`);
    // Implement status update functionality
  };

  // Hàm xử lý phân công xe cho đơn hàng
  const handleAssignVehicle = async () => {
    if (!id) return;

    try {
      setAssigningVehicle(true);
      await orderService.updateVehicleAssignmentForDetails(id);
      messageApi.success("Đã phân công xe cho đơn hàng thành công");
      // Refresh order details
      refetch();
    } catch (error) {
      messageApi.error("Không thể phân công xe cho đơn hàng");
      console.error("Error assigning vehicle:", error);
    } finally {
      setAssigningVehicle(false);
    }
  };

  const handlePreviewContract = async () => {
    if (!id) return;

    console.log("handlePreviewContract called with ID:", id);
    setLoadingContractData(true);
    try {
      const response = await contractService.getContractPdfData(id);
      console.log("Contract PDF data response:", response);
      if (response.success) {
        setContractData(response.data);
        setContractPreviewVisible(true);
        console.log("Contract data set SUCCESSFUL");
      } else {
        messageApi.error(response.message);
        console.error("Contract service returned error:", response.message);
      }
    } catch (error) {
      messageApi.error("Không thể tải dữ liệu hợp đồng");
      console.error("Error fetching contract data:", error);
    } finally {
      setLoadingContractData(false);
    }
  };

  const handleCreateContract = () => {
    if (!id || !order) return;
    contractForm.setFieldsValue({
      contractName: `Hợp đồng đơn hàng ${order.orderCode}`,
      effectiveDate: dayjs(),
      expirationDate: dayjs().add(1, "year"),
      adjustedValue: order.totalPrice || 0,
      description: `Hợp đồng vận chuyển cho đơn hàng ${order.orderCode}`,
      orderId: id,
      staffId: "current-staff-id",
    });

    setContractModalVisible(true);
  };

  
  // Handle order status changes via WebSocket using standardized utility
  const handleOrderStatusChange = createOrderStatusChangeHandler({
    orderId: id,
    refetch: refetch,
    messageApi: messageApi,
    // Use default staff notifications - no custom ones needed
    onTabSwitch: (tabKey: string) => {
      // Map tab keys to staff order detail tabs
      const tabMapping: Record<string, string> = {
        'contract': 'contract',
        'detail': 'info',
        'details': 'info',
      };
      const mappedTab = tabMapping[tabKey] || tabKey;
      setActiveTab(mappedTab);
    },
  });

  const handleContractSubmit = async (values: any) => {
    setCreatingContract(true);
    try {
      const contractData: CreateContractRequest = {
        ...values,
        effectiveDate: values.effectiveDate.format("YYYY-MM-DDTHH:mm:ss"),
        expirationDate: values.expirationDate.format("YYYY-MM-DDTHH:mm:ss"),
        orderId: id!,
        staffId: "current-staff-id",
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
  // Render lịch sử đơn hàng
  const renderOrderHistory = () => {
    return (
      <Timeline
        mode="left"
        items={[
          {
            label: dayjs().subtract(3, "day").format("DD/MM/YYYY HH:mm"),
            children: "Đơn hàng được tạo",
            color: "blue",
          },
          {
            label: dayjs().subtract(2, "day").format("DD/MM/YYYY HH:mm"),
            children: "Đơn hàng được xác nhận",
            color: "green",
          },
          {
            label: dayjs().subtract(1, "day").format("DD/MM/YYYY HH:mm"),
            children: "Đã phân công tài xế",
            color: "blue",
          },
          {
            label: dayjs().subtract(12, "hour").format("DD/MM/YYYY HH:mm"),
            children: "Đã lấy hàng",
            color: "blue",
          },
          {
            label: dayjs().subtract(6, "hour").format("DD/MM/YYYY HH:mm"),
            children: "Đang vận chuyển",
            color: "orange",
          },
        ]}
      />
    );
  };

  // Render tiến trình vận chuyển
  const renderDeliveryProgress = () => {
    // Xác định bước hiện tại dựa trên trạng thái đơn hàng
    let currentStep = 0;
    if (order) {
      switch (order.status) {
        case "PENDING":
          currentStep = 0;
          break;
        case "PROCESSING":
        case "CONTRACT_DRAFT":
        case "CONTRACT_SIGNED":
          currentStep = 1;
          break;
        case "ASSIGNED_TO_DRIVER":
        case "DRIVER_CONFIRM":
          currentStep = 2;
          break;
        case "PICKING_UP":
        case "SEALED_COMPLETED":
        case "ON_DELIVERED":
          currentStep = 3;
          break;
        case "DELIVERED":
        case "SUCCESSFUL":
          currentStep = 4;
          break;
        default:
          currentStep = 0;
      }
    }

    return (
      <Card className="shadow-md rounded-xl mb-6">
        <div className="p-4">
          <Steps
            current={currentStep}
            items={[
              {
                title: "Đơn hàng mới",
                description: "Đơn hàng đã được tạo",
              },
              {
                title: "Xác nhận",
                description: "Đơn hàng được xác nhận",
              },
              {
                title: "Phân công",
                description: "Đã phân công tài xế",
              },
              {
                title: "Vận chuyển",
                description: "Đang vận chuyển",
              },
              {
                title: "Hoàn thành",
                description: "Giao hàng thành công",
              },
            ]}
          />
        </div>
      </Card>
    );
  };

  // Render công cụ quản lý cho nhân viên
  const renderStaffTools = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Cập nhật trạng thái" className="shadow-md">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium mb-1">Trạng thái hiện tại</p>
              <p className="text-blue-600">
                {order?.status || "Chưa xác định"}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUpdateStatus("DELIVERED")}
              >
                Xác nhận đã giao hàng
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleUpdateStatus("IN_TROUBLES")}
              >
                Báo cáo sự cố
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Thông tin liên hệ" className="shadow-md">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">Người nhận</p>
              <p>{order?.receiverName || "Không có thông tin"}</p>
              <p>{order?.receiverPhone || "Không có số điện thoại"}</p>
            </div>
            <Button
              type="primary"
              block
              onClick={() => messageApi.info("Tính năng đang được phát triển")}
            >
              Liên hệ khách hàng
            </Button>
          </div>
        </Card>
      </div>
    );
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
          <Button type="primary" onClick={() => navigate("/staff/orders")}>
            Quay lại danh sách đơn hàng
          </Button>
        </div>
      </div>
    );
  }

  // Subscribe to order status changes
  useOrderStatusTracking({
    orderId: id,
    autoConnect: true,
    onStatusChange: handleOrderStatusChange,
  });

  return (
    <div>
      {/* Header section with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <Button
                  type="default"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/staff/orders")}
                  className="mr-2 bg-white"
                >
                  Quay lại
                </Button>
                <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
              </div>
              <p className="text-blue-100 mt-1">
                Mã đơn hàng: {order?.orderCode}
              </p>
            </div>
            <div className="flex gap-3">
              {order?.status === OrderStatusEnum.ON_PLANNING && (
                <Button
                  type="primary"
                  icon={<CarOutlined />}
                  onClick={handleAssignVehicle}
                  loading={assigningVehicle}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Phân công xe
                </Button>
              )}
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={handlePreviewContract}
                loading={loadingContractData}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Xem trước hợp đồng
              </Button>
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={handleCreateContract}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Tạo hợp đồng
              </Button>
              <Button
                type="primary"
                icon={<CarOutlined />}
                onClick={() =>
                  messageApi.info("Tính năng đang được phát triển")
                }
              >
                Theo dõi vận chuyển
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

        {/* Delivery Progress */}
        {renderDeliveryProgress()}

        {/* Staff Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <Tabs
            defaultActiveKey="info"
            onChange={setActiveTab}
            type="card"
            className="order-detail-tabs"
          >
            <TabPane
              tab={
                <span>
                  <InfoCircleOutlined /> Thông tin đơn hàng
                </span>
              }
              key="info"
            >
              {activeTab === "info" && (
                <>
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

                  {/* Multi-Trip Support: Show ALL trips */}
                  {order.orderDetails && order.orderDetails.length > 0 && (() => {
                    // Group orderDetails by vehicleAssignmentId
                    type OrderDetail = typeof order.orderDetails[0];
                    const tripGroups = order.orderDetails.reduce((acc: Record<string, OrderDetail[]>, detail: OrderDetail) => {
                      const vaId = detail.vehicleAssignmentId?.id || 'unassigned';
                      if (!acc[vaId]) acc[vaId] = [];
                      acc[vaId].push(detail);
                      return acc;
                    }, {});

                    return (Object.entries(tripGroups) as [string, OrderDetail[]][]).map(([vaId, details], index) => (
                      <div key={vaId} style={{ marginBottom: '16px' }}>
                        {Object.keys(tripGroups).length > 1 && (
                          <h3 style={{ 
                            color: '#1890ff', 
                            marginBottom: '12px',
                            fontSize: '16px',
                            fontWeight: 600
                          }}>
                            🚚 Chuyến xe #{index + 1} ({details.length} kiện hàng)
                          </h3>
                        )}
                        
                        {/* Order Size for this trip */}
                        {details[0].orderSizeId && (
                          <OrderSizeCard orderSize={details[0].orderSizeId} />
                        )}

                        {/* Vehicle Assignment for this trip */}
                        {vaId !== 'unassigned' && (
                          <VehicleAssignmentCard
                            vehicleAssignment={details[0].vehicleAssignmentId}
                          />
                        )}
                      </div>
                    ));
                  })()}
                </>
              )}
            </TabPane>
            <TabPane
              tab={
                <span>
                  <FileTextOutlined /> Hợp đồng
                </span>
              }
              key="contract"
            >
              {activeTab === "contract" && (
                <Card className="shadow-md rounded-xl mb-6">
                  <div className="p-4">
                    <div className="mb-4 p-3 bg-gray-100 rounded">
                      <p>
                        <strong>Debug Info:</strong>
                      </p>
                      <p>Order Status: {order?.status}</p>
                      <p>
                        Contract Data: {contractData ? "Loaded" : "Not loaded"}
                      </p>
                      <p>Loading: {loadingContractData ? "Yes" : "No"}</p>
                    </div>

                    {order?.status === "CONTRACT_DRAFT" ? (
                      <div className="text-center py-8">
                        <p className="text-blue-600 mb-4">
                          Đơn hàng đang ở trạng thái CONTRACT_DRAFT
                        </p>
                        <Button
                          type="primary"
                          icon={<FileTextOutlined />}
                          onClick={handlePreviewContract}
                          loading={loadingContractData}
                          size="large"
                        >
                          Tạo bản xem trước hợp đồng
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          Hợp đồng chưa được tạo hoặc đơn hàng chưa ở trạng thái
                          thích hợp
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                          Trạng thái hiện tại: {order?.status}
                        </p>
                        <Button
                          type="primary"
                          icon={<FileTextOutlined />}
                          onClick={handleCreateContract}
                        >
                          Tạo hợp đồng
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabPane>
            <TabPane
              tab={
                <span>
                  <HistoryOutlined /> Lịch sử đơn hàng
                </span>
              }
              key="history"
            >
              {activeTab === "history" && (
                <Card className="shadow-md rounded-xl mb-6">
                  <div className="p-4">{renderOrderHistory()}</div>
                </Card>
              )}
            </TabPane>
            <TabPane
              tab={
                <span>
                  <ToolOutlined /> Công cụ hỗ trợ
                </span>
              }
              key="tools"
            >
              {activeTab === "tools" && renderStaffTools()}
            </TabPane>
          </Tabs>
        </div>
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

      {/* Contract Preview Modal */}
      <Modal
        title="Xem trước hợp đồng"
        open={contractPreviewVisible}
        onCancel={() => setContractPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setContractPreviewVisible(false)}>
            Đóng
          </Button>,
          <Button key="print" type="primary" onClick={() => window.print()}>
            In hợp đồng
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: "1200px" }}
        className="contract-preview-modal"
      >
        {contractData && (
          <StaffContractPreview
            contractData={contractData}
            //onSave={handleContractSave}
          />
        )}
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
