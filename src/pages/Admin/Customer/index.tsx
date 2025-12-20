import React, { useState } from "react";
import { App, Card, Typography, Input, Button } from "antd";
import {
  ShopOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  LockOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import customerService from "../../../services/customer";
import type {
  CustomerModel,
  convertToCustomerModel,
} from "../../../models/Customer";
import { convertToCustomerModel as convertCustomer } from "../../../models/Customer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerTable from "./components/CustomerTable";
import StatusChangeModal from "../../../components/common/StatusChangeModal";
import type { StatusOption } from "../../../components/common/StatusChangeModal";
import UserStatCards from "../../../components/common/UserStatCards";
import { UserStatusEnum } from "../../../constants/enums/UserStatusEnum";

const { Title, Text } = Typography;

const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerModel | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [searchText, setSearchText] = useState("");

  const {
    data: customersData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const customers = await customerService.getAllCustomers();
      return customers.map(convertCustomer);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      customerService.updateCustomerStatus(id, status),
    onSuccess: () => {
      message.success("Cập nhật trạng thái khách hàng thành công");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsStatusModalVisible(false);
    },
    onError: () => {
      message.error("Cập nhật trạng thái khách hàng thất bại");
    },
  });

  const handleViewDetails = (customerId: string) => {
    navigate(`/admin/customers/${customerId}`);
  };

  const handleStatusChange = (customer: CustomerModel) => {
    setSelectedCustomer(customer);
    setNewStatus(customer.status);
    setIsStatusModalVisible(true);
  };

  const handleStatusUpdate = () => {
    if (selectedCustomer && newStatus) {
      updateStatusMutation.mutate({
        id: selectedCustomer.customerId,
        status: newStatus,
      });
    }
  };

  const filteredCustomers = customersData?.filter((customer) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      customer.fullName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phoneNumber.toLowerCase().includes(searchLower) ||
      customer.username.toLowerCase().includes(searchLower)
    );
  });

  // Chuyển đổi dữ liệu để sử dụng với UserStatCards
  const usersForStatCards =
    customersData?.map((customer) => ({
      id: customer.id,
      status: customer.status,
    })) || [];

  // Status handling functions
  const getStatusColor = (status: string | boolean) => {
    if (typeof status === "string") {
      switch (status.toLowerCase()) {
        case "active":
          return "green";
        case "inactive":
          return "default";
        case "banned":
          return "red";
        default:
          return "default";
      }
    }
    return "default";
  };

  const getStatusText = (status: string | boolean) => {
    if (typeof status === "string") {
      switch (status.toLowerCase()) {
        case "active":
          return "Hoạt động";
        case "inactive":
          return "Không hoạt động";
        case "banned":
          return "Bị cấm";
        default:
          return status || "Không xác định";
      }
    }
    return "Không xác định";
  };

  // Status options for the modal - chỉ hiển thị các trạng thái cần thiết
  const statusOptions: StatusOption[] = [
    {
      value: UserStatusEnum.ACTIVE,
      label: "Hoạt động",
      description: "Khách hàng có thể đặt và theo dõi đơn hàng",
      color: "green",
      icon: <CheckCircleOutlined />,
    },
    {
      value: UserStatusEnum.INACTIVE,
      label: "Không hoạt động",
      description:
        "Khách hàng tạm thời không thể đăng nhập và sử dụng hệ thống",
      color: "default",
      icon: <StopOutlined />,
    },
    {
      value: UserStatusEnum.BANNED,
      label: "Bị cấm",
      description: "Khách hàng bị cấm sử dụng hệ thống",
      color: "red",
      icon: <LockOutlined />,
    },
  ];

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
        <p className="text-red-500 text-xl mb-4">
          Đã xảy ra lỗi khi tải dữ liệu
        </p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="flex items-center m-0 text-blue-800">
              <ShopOutlined className="mr-3 text-blue-600" /> Quản lý khách hàng
            </Title>
            <Text type="secondary">
              Quản lý thông tin và trạng thái của các khách hàng trong hệ thống
            </Text>
          </div>
        </div>

        {/* Hiển thị card thống kê cho tất cả các trạng thái khách hàng */}
        <UserStatCards
          users={usersForStatCards}
          loading={isLoading}
          userType="customer"
        />

        <Card className="shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <Title level={4} className="m-0 mb-4 md:mb-0">
              Danh sách khách hàng
            </Title>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                placeholder="Tìm kiếm theo tên, email, tên đăng nhập, số điện thoại..."
                prefix={<SearchOutlined />}
                className="w-full md:w-80"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                disabled={isLoading}
              />
              <Button
                icon={<ReloadOutlined spin={isFetching} />}
                onClick={() => refetch()}
                title="Làm mới dữ liệu"
                loading={isFetching}
              />
            </div>
          </div>

          <CustomerTable
            data={filteredCustomers || []}
            loading={isLoading}
            onViewDetails={handleViewDetails}
            onStatusChange={handleStatusChange}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </Card>
      </div>

      <StatusChangeModal
        visible={isStatusModalVisible}
        loading={updateStatusMutation.isPending}
        title="Cập nhật trạng thái khách hàng"
        icon={<ShopOutlined />}
        entityName={selectedCustomer?.fullName || ""}
        entityDescription={selectedCustomer?.email || ""}
        avatarIcon={<ShopOutlined />}
        currentStatus={selectedCustomer?.status || ""}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        statusOptions={statusOptions}
        selectedStatus={newStatus}
        onStatusChange={setNewStatus}
        onOk={handleStatusUpdate}
        onCancel={() => setIsStatusModalVisible(false)}
      />
    </div>
  );
};

export default CustomerPage;
