import { BoxPlotOutlined, SendOutlined } from "@ant-design/icons";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Typography } from "antd";

const { Text, Title } = Typography;
const OrdersHeader: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto mt-5">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <BoxPlotOutlined className="text-2xl text-blue-600" />
          <Title level={2} className="!mb-0 text-gray-800">
            Đơn Hàng Đặt Của Tôi
          </Title>
        </div>
        <Link to="/create-order" type="primary">
          <Button type="primary" icon={<SendOutlined />} size="large">
            Giao Hàng Mới
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OrdersHeader;
