import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Result, Button, Card, Descriptions, Spin } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import httpClient from "../../services/api/httpClient";

const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [webhookCalled, setWebhookCalled] = useState(false);

  const code = searchParams.get("code");
  const id = searchParams.get("id");
  const cancel = searchParams.get("cancel");
  const status = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    const callWebhook = async () => {
      if (!orderCode || !status || webhookCalled) {
        return;
      }

      try {
        console.log("Calling PayOS webhook with:", { orderCode, status });

        const response = await httpClient.post("/transactions/pay-os/webhook", {
          data: {
            orderCode: Number(orderCode),
            status: status,
          },
        });

        console.log("Webhook response:", response.data);
        setWebhookCalled(true);

        if (response.data?.success) {
          console.log("Webhook called SUCCESSFUL");
        }
      } catch (error) {
        console.error("Error calling webhook:", error);
      }
    };

    callWebhook();
  }, [orderCode, status, webhookCalled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  const isSuccess = code === "00" && status === "PAID" && cancel !== "true";
  const isCancelled = cancel === "true" || status === "CANCELLED";
  const isPending = status === "PENDING";

  const getStatusInfo = () => {
    if (isSuccess) {
      return {
        status: "success" as const,
        title: "Thanh toán thành công!",
        subTitle:
          "Giao dịch của bạn đã được xử lý thành công. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.",
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
      };
    } else if (isCancelled) {
      return {
        status: "error" as const,
        title: "Thanh toán đã bị hủy",
        subTitle:
          "Giao dịch của bạn đã bị hủy. Vui lòng thử lại nếu bạn muốn tiếp tục thanh toán.",
        icon: <CloseCircleOutlined />,
        color: "#ff4d4f",
      };
    } else if (isPending) {
      return {
        status: "warning" as const,
        title: "Thanh toán đang xử lý",
        subTitle:
          "Giao dịch của bạn đang được xử lý. Vui lòng kiểm tra lại sau.",
        icon: <ClockCircleOutlined />,
        color: "#faad14",
      };
    } else {
      return {
        status: "info" as const,
        title: "Thanh toán không thành công",
        subTitle:
          "Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau.",
        icon: <CloseCircleOutlined />,
        color: "#1890ff",
      };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="text-center p-8 shadow-lg">
          <Spin size="large" />
          <p className="mt-4 text-gray-600 text-lg">
            Đang xử lý kết quả thanh toán...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Result
          status={statusInfo.status}
          icon={
            <div style={{ fontSize: "72px", color: statusInfo.color }}>
              {statusInfo.icon}
            </div>
          }
          title={
            <h1
              className="text-3xl font-bold"
              style={{ color: statusInfo.color }}
            >
              {statusInfo.title}
            </h1>
          }
          subTitle={
            <p className="text-lg text-gray-600 mt-2">{statusInfo.subTitle}</p>
          }
          extra={[
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              key="home"
            >
              Về trang chủ
            </Button>,
            <Button
              size="large"
              icon={<FileTextOutlined />}
              onClick={() => navigate("/orders")}
              key="orders"
            >
              Xem đơn hàng
            </Button>,
          ]}
        />

        {/* Payment Details Card */}
        <Card
          title="Chi tiết giao dịch"
          className="mt-8 shadow-lg"
          bordered={false}
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã giao dịch">
              <span className="font-mono font-semibold">{id || "N/A"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Mã đơn hàng">
              <span className="font-mono font-semibold">
                {orderCode || "N/A"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <span
                className="font-semibold px-3 py-1 rounded"
                style={{
                  backgroundColor: `${statusInfo.color}20`,
                  color: statusInfo.color,
                }}
              >
                {status || "N/A"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Mã phản hồi">
              <span className="font-mono">{code || "N/A"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {new Date().toLocaleString("vi-VN")}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Additional Information */}
        {isSuccess && (
          <Card className="mt-6 bg-green-50 border-green-200" bordered={false}>
            <div className="flex items-start">
              <CheckCircleOutlined className="text-green-500 text-2xl mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Thanh toán đã hoàn tất
                </h3>
                <p className="text-green-700">
                  Đơn hàng của bạn đã được xác nhận và đang được xử lý. Chúng
                  tôi sẽ thông báo cho bạn khi có cập nhật mới.
                </p>
                <p className="text-green-700 mt-2">
                  Bạn có thể kiểm tra trạng thái đơn hàng trong phần "Đơn hàng
                  của tôi".
                </p>
              </div>
            </div>
          </Card>
        )}

        {isCancelled && (
          <Card className="mt-6 bg-red-50 border-red-200" bordered={false}>
            <div className="flex items-start">
              <CloseCircleOutlined className="text-red-500 text-2xl mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Giao dịch bị hủy
                </h3>
                <p className="text-red-700">
                  Bạn đã hủy giao dịch thanh toán. Không có khoản tiền nào được
                  trừ từ tài khoản của bạn.
                </p>
                <p className="text-red-700 mt-2">
                  Nếu bạn muốn tiếp tục thanh toán, vui lòng quay lại trang đơn
                  hàng và thử lại.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Support Information */}
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">
            Nếu bạn có bất kỳ thắc mắc nào về giao dịch này,
          </p>
          <p>
            vui lòng liên hệ với chúng tôi qua email:{" "}
            <a
              href="mailto:support@truckie.vn"
              className="text-blue-600 hover:underline"
            >
              support@truckie.vn
            </a>{" "}
            hoặc hotline:{" "}
            <a href="tel:0123456789" className="text-blue-600 hover:underline">
              0123 456 789
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
