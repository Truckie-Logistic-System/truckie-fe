import React from "react";
import { Card, Typography, Tag, Descriptions, Divider } from "antd";
import {
  InfoCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { OrderStatusEnum, OrderStatusLabels } from "../../../constants/enums";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface RecipientBasicInfoTabProps {
  order: any;
}

/**
 * RecipientBasicInfoTab - Hiển thị thông tin cơ bản đơn hàng cho người nhận
 * Không hiển thị thông tin nhạy cảm như hợp đồng, thanh toán
 */
const RecipientBasicInfoTab: React.FC<RecipientBasicInfoTabProps> = ({ order }) => {
  const formatDate = (date?: string) => {
    if (!date) return "Chưa cập nhật";
    return dayjs(date).format("DD/MM/YYYY HH:mm");
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: "gold",
      PROCESSING: "blue",
      CONTRACT_DRAFT: "cyan",
      CONTRACT_SIGNED: "geekblue",
      ON_PLANNING: "purple",
      ASSIGNED_TO_DRIVER: "magenta",
      FULLY_PAID: "green",
      PICKING_UP: "lime",
      ON_DELIVERED: "orange",
      ONGOING_DELIVERED: "volcano",
      DELIVERED: "green",
      IN_TROUBLES: "red",
      RESOLVED: "cyan",
      COMPENSATION: "gold",
      SUCCESSFUL: "green",
      REJECT_ORDER: "red",
      RETURNING: "orange",
      RETURNED: "purple",
      CANCELLED: "default",
    };
    return colorMap[status] || "default";
  };

  return (
    <div className="space-y-6">
      {/* Sender & Receiver Information - Same Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sender Information */}
        <Card className="shadow-sm rounded-xl">
          <Title level={5} className="!mb-4 flex items-center">
            <UserOutlined className="mr-2 text-blue-600" />
            Thông tin người gửi
          </Title>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Tên người gửi">
              {order.senderName || "Không có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              <PhoneOutlined className="mr-1" />
              {order.senderPhone || "Không có thông tin"}
            </Descriptions.Item>
            {order.senderCompanyName && (
              <Descriptions.Item label="Công ty">
                {order.senderCompanyName}
              </Descriptions.Item>
            )}
          </Descriptions>
          <Divider className="my-3" />
          <div className="flex items-start">
            <EnvironmentOutlined className="mr-2 text-green-600 mt-1" />
            <div>
              <Text type="secondary" className="text-xs">Địa chỉ lấy hàng</Text>
              <div className="font-medium">{order.pickupAddress || "Chưa cập nhật"}</div>
            </div>
          </div>
        </Card>

        {/* Receiver Information */}
        <Card className="shadow-sm rounded-xl">
          <Title level={5} className="!mb-4 flex items-center">
            <UserOutlined className="mr-2 text-green-600" />
            Thông tin người nhận
          </Title>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Tên người nhận">
              {order.receiverName || "Không có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              <PhoneOutlined className="mr-1" />
              {order.receiverPhone || "Không có thông tin"}
            </Descriptions.Item>
            {order.receiverIdentity && (
              <Descriptions.Item label="CCCD/CMND">
                {order.receiverIdentity}
              </Descriptions.Item>
            )}
          </Descriptions>
          <Divider className="my-3" />
          <div className="flex items-start">
            <EnvironmentOutlined className="mr-2 text-red-600 mt-1" />
            <div>
              <Text type="secondary" className="text-xs">Địa chỉ giao hàng</Text>
              <div className="font-medium">{order.deliveryAddress || "Chưa cập nhật"}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Information */}
      <Card className="shadow-sm rounded-xl">
        <Title level={5} className="!mb-4 flex items-center">
          <TagOutlined className="mr-2 text-blue-600" />
          Thông tin đơn hàng
        </Title>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Mã đơn hàng">
            <Text strong className="text-blue-600">{order.orderCode}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            <ClockCircleOutlined className="mr-1" />
            {formatDate(order.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Số lượng kiện">
            {order.totalQuantity} kiện
          </Descriptions.Item>
          <Descriptions.Item label="Loại hàng">
            {order.categoryDescription || order.categoryName || "Chưa phân loại"}
          </Descriptions.Item>
        </Descriptions>

        {/* Package description & notes */}
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <p className="mb-2">
            <span className="font-medium">Mô tả hàng hóa:</span>{" "}
            {order.packageDescription || "Không có mô tả"}
          </p>
          {order.notes && (
            <p className="mb-0">
              <span className="font-medium">Ghi chú:</span>{" "}
              {order.notes}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RecipientBasicInfoTab;
