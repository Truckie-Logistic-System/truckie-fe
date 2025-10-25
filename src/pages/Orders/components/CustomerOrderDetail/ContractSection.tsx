import React, { useState } from "react";
import { Card, Descriptions, Empty, Button, App, Alert, Divider, Statistic, Row, Col } from "antd";
import {
  FileTextOutlined,
  EditOutlined,
  CreditCardOutlined,
  InfoCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import orderService from "../../../../services/order/orderService";
import { ContractStatusTag } from "../../../../components/common/tags";
import { ContractStatusEnum } from "../../../../constants/enums";

interface ContractProps {
  contract?: {
    id: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    totalValue: string;
    adjustedValue: string;
    description: string;
    attachFileUrl: string;
    status: string;
    staffName: string;
  };
  orderStatus?: string;
  depositAmount?: number;
}

const ContractSection: React.FC<ContractProps> = ({ contract, orderStatus, depositAmount }) => {
  const messageApi = App.useApp().message;
  const hasAdjustedValue = Boolean(contract?.adjustedValue && contract.adjustedValue !== "0");
  const [signingContract, setSigningContract] = useState<boolean>(false);
  const [payingDeposit, setPayingDeposit] = useState<boolean>(false);
  const [payingFullAmount, setPayingFullAmount] = useState<boolean>(false);

  const handleSignContract = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    setSigningContract(true);
    try {
      await orderService.signContract(contract.id);
      messageApi.success({
        content: "Ký hợp đồng thành công! Vui lòng thanh toán đặt cọc để tiếp tục.",
        duration: 5,
      });
      // Reload the page to reflect the updated contract status
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error signing contract:", error);
      messageApi.error("Có lỗi xảy ra khi ký hợp đồng");
    } finally {
      setSigningContract(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    setPayingDeposit(true);
    try {
      const response = await orderService.payDeposit(contract.id);
      messageApi.success("Khởi tạo thanh toán đặt cọc thành công!");

      // Parse the gatewayResponse to get the checkoutUrl
      let checkoutUrl = null;
      if (response?.data?.gatewayResponse) {
        try {
          const gatewayData = JSON.parse(response.data.gatewayResponse);
          checkoutUrl = gatewayData.checkoutUrl;
        } catch (parseError) {
          console.error("Error parsing gatewayResponse:", parseError);
        }
      }

      // If we have a checkout URL, redirect to it
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
      } else {
        messageApi.info("Đang chuyển hướng đến trang thanh toán...");
        // Reload the page to reflect any status changes
        window.location.reload();
      }
    } catch (error) {
      console.error("Error paying deposit:", error);
      messageApi.error("Có lỗi xảy ra khi thanh toán đặt cọc");
    } finally {
      setPayingDeposit(false);
    }
  };

  const handlePayFullAmount = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    setPayingFullAmount(true);
    try {
      const response = await orderService.payFullAmount(contract.id);
      messageApi.success("Khởi tạo thanh toán toàn bộ thành công!");

      // Parse the gatewayResponse to get the checkoutUrl
      let checkoutUrl = null;
      if (response?.data?.gatewayResponse) {
        try {
          const gatewayData = JSON.parse(response.data.gatewayResponse);
          checkoutUrl = gatewayData.checkoutUrl;
        } catch (parseError) {
          console.error("Error parsing gatewayResponse:", parseError);
        }
      }

      // If we have a checkout URL, redirect to it
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
      } else {
        messageApi.info("Đang chuyển hướng đến trang thanh toán...");
        // Reload the page to reflect any status changes
        window.location.reload();
      }
    } catch (error) {
      console.error("Error paying full amount:", error);
      messageApi.error("Có lỗi xảy ra khi thanh toán toàn bộ");
    } finally {
      setPayingFullAmount(false);
    }
  };


  return (
    <Card
      title={
        <div className="flex items-center">
          <FileTextOutlined className="mr-2 text-blue-500" />
          <span>Thông tin hợp đồng</span>
        </div>
      }
      className="shadow-md mb-6 rounded-xl"
    >
      {contract ? (
        <>
          {/* Payment Summary */}
          {depositAmount && (
            <div className="mb-6">
              <Alert
                message="Thông tin thanh toán"
                description={
                  <Row gutter={[16, 16]} className="mt-3">
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Tổng giá trị đơn hàng"
                        value={contract.totalValue}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    {hasAdjustedValue && (
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Giá trị điều chỉnh"
                          value={contract.adjustedValue}
                          prefix={<DollarOutlined />}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Col>
                    )}
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Số tiền cọc cần thanh toán"
                        value={depositAmount.toLocaleString('vi-VN')}
                        suffix="VNĐ"
                        prefix={<CreditCardOutlined />}
                        valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Số tiền còn lại"
                        value={(() => {
                          const baseValue = contract.adjustedValue 
                            ? (typeof contract.adjustedValue === 'string' 
                              ? parseFloat(contract.adjustedValue.replace(/[^0-9.-]+/g, '')) 
                              : Number(contract.adjustedValue) || 0)
                            : (typeof contract.totalValue === 'string' 
                              ? parseFloat(contract.totalValue.replace(/[^0-9.-]+/g, '')) 
                              : Number(contract.totalValue) || 0);
                          return (baseValue - depositAmount).toLocaleString('vi-VN');
                        })()}
                        suffix="VNĐ"
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                  </Row>
                }
                type="info"
                icon={<InfoCircleOutlined />}
                showIcon
              />
            </div>
          )}

          <Divider orientation="left">Chi tiết hợp đồng</Divider>

          <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item label="Tên hợp đồng">
              {contract.contractName || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hiệu lực">
              {contract.effectiveDate || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn">
              {contract.expirationDate || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị hợp đồng">
              {contract.totalValue || "Chưa có thông tin"}
            </Descriptions.Item>
            {hasAdjustedValue && (
              <Descriptions.Item label="Giá trị điều chỉnh">
                {contract.adjustedValue}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Trạng thái">
              {contract.status ? (
                <ContractStatusTag status={contract.status as ContractStatusEnum} />
              ) : (
                "Chưa có thông tin"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Nhân viên phụ trách">
              {contract.staffName || "Chưa có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={3}>
              {contract.description || "Không có mô tả"}
            </Descriptions.Item>
          </Descriptions>

          {/* Action Guidance */}
          {(contract.status === "CONTRACT_DRAFT" || contract.status === "PENDING") && (
            <Alert
              message="Hướng dẫn"
              description="Vui lòng xem và ký hợp đồng để tiếp tục quá trình vận chuyển."
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
          {(contract.status === "CONTRACT_SIGNED" || contract.status === "UNPAID") && depositAmount && (
            <Alert
              message="Bước tiếp theo"
              description={`Hợp đồng đã được ký thành công! Vui lòng thanh toán đặt cọc ${depositAmount.toLocaleString('vi-VN')} VNĐ để chúng tôi bắt đầu xử lý đơn hàng.`}
              type="success"
              showIcon
              className="mt-4"
            />
          )}
          {contract.status === "DEPOSITED" && orderStatus === "ASSIGNED_TO_DRIVER" && (
            <Alert
              message="Sẵn sàng vận chuyển"
              description="Đơn hàng đã được phân công cho tài xế. Vui lòng thanh toán số tiền còn lại để hoàn tất."
              type="info"
              showIcon
              className="mt-4"
            />
          )}

          {/* Các nút hành động cho customer */}
          <div className="mt-4 flex flex-wrap gap-3">
            {contract.attachFileUrl && contract.attachFileUrl !== "N/A" ? (
              <>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  href={contract.attachFileUrl}
                  target="_blank"
                  size="large"
                >
                  Xem chi tiết hợp đồng
                </Button>

                {/* Nút ký hợp đồng chỉ hiện khi có file và trạng thái phù hợp */}
                {(contract.status === "CONTRACT_DRAFT" ||
                  contract.status === "PENDING") && (
                  <Button
                    type="default"
                    icon={<EditOutlined />}
                    onClick={handleSignContract}
                    loading={signingContract}
                    size="large"
                    className="ml-3"
                  >
                    Ký hợp đồng
                  </Button>
                )}

                {/* Nút thanh toán đặt cọc chỉ hiện khi hợp đồng đã ký */}
                {(contract.status === "CONTRACT_SIGNED" ||
                  contract.status === "UNPAID") && (
                  <Button
                    type="primary"
                    icon={<CreditCardOutlined />}
                    onClick={handlePayDeposit}
                    loading={payingDeposit}
                    size="large"
                    className="bg-green-500 hover:bg-green-600 border-green-500"
                  >
                    {depositAmount ? `Thanh Toán Đặt Cọc ${depositAmount.toLocaleString('vi-VN')} VNĐ` : 'Thanh Toán Đặt Cọc'}
                  </Button>
                )}

                {/* Nút thanh toán toàn bộ chỉ hiện khi contract status là DEPOSITED và order status là ASSIGNED_TO_DRIVER */}
                {contract.status === "DEPOSITED" &&
                  orderStatus === "ASSIGNED_TO_DRIVER" && (
                    <Button
                      type="primary"
                      icon={<CreditCardOutlined />}
                      onClick={handlePayFullAmount}
                      loading={payingFullAmount}
                      size="large"
                      className="ml-3"
                      style={{ backgroundColor: "#52c41a" }}
                    >
                      Thanh Toán Toàn Bộ
                    </Button>
                  )}
              </>
            ) : (
              <p className="text-gray-500">Chưa có file hợp đồng</p>
            )}
          </div>
        </>
      ) : (
        <Empty description="Chưa có thông tin hợp đồng" />
      )}
    </Card>
  );
};

export default ContractSection;
