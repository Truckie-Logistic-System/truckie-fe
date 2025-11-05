import React, { useState, useEffect } from "react";
import {
  Card,
  Empty,
  Button,
  App,
  Alert,
  Divider,
  Statistic,
  Row,
  Col,
  Spin,
} from "antd";
import {
  FileTextOutlined,
  EditOutlined,
  CreditCardOutlined,
  DollarOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { ContractStatusTag } from "../../../../components/common/tags";
import { ContractStatusEnum, OrderStatusEnum } from "../../../../constants/enums";
import { useRefreshOrderDetail, useContractOperations } from "../../../../hooks";
import type { PriceDetails } from "../../../../services/contract/contractTypes";
import contractSettingService from "../../../../services/contract/contractSettingService";
import type { ContractSettings } from "../../../../models/Contract";

// Utility function to safely parse contract values
const parseContractValue = (value: string | number | undefined): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  return isNaN(numericValue) ? 0 : numericValue;
};


interface ContractProps {
  contract?: {
    id: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    totalValue: number;
    adjustedValue: number;
    description: string;
    attachFileUrl: string;
    status: string;
    staffName: string;
  };
  orderStatus?: string;
  depositAmount?: number;
  priceDetails?: PriceDetails;
  loadingPriceDetails?: boolean;
}

const ContractSection: React.FC<ContractProps> = ({
  contract,
  orderStatus,
  depositAmount,
  priceDetails,
  loadingPriceDetails = false,
}) => {
  const messageApi = App.useApp().message;
  const [contractSettings, setContractSettings] = useState<ContractSettings | null>(null);
  
  // Fetch contract settings on component mount
  useEffect(() => {
    const fetchContractSettings = async () => {
      try {
        const response = await contractSettingService().getContractSettings();
        console.log("Contract settings response:", response);
        // API returns array, take first element as it's always unique
        if (response.data && response.data.length > 0) {
          console.log("Setting contract settings:", response.data[0]);
          setContractSettings(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching contract settings:", error);
      }
    };
    
    fetchContractSettings();
  }, []);
  
  const { refetch: refetchOrderDetail } = useRefreshOrderDetail('customer');
  const {
    signingContract,
    payingDeposit,
    payingFullAmount,
    signContract: signContractFn,
    payDeposit: payDepositFn,
    payFullAmount: payFullAmountFn,
  } = useContractOperations();

  const hasAdjustedValue = Boolean(
    contract?.adjustedValue && contract.adjustedValue !== 0
  );

  // Hide contract information when order status is "processing"
  if (orderStatus?.toUpperCase() === OrderStatusEnum.PROCESSING) {
    return null;
  }

  const handleSignContract = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      await signContractFn(contract.id);
      messageApi.success({
        content:
          "Ký hợp đồng thành công! Vui lòng thanh toán đặt cọc để tiếp tục.",
        duration: 5,
      });
      // Refetch order detail to reflect the updated contract status
      setTimeout(() => {
        refetchOrderDetail();
      }, 1500);
    } catch (error) {
      console.error("Error signing contract:", error);
      messageApi.error("Có lỗi xảy ra khi ký hợp đồng");
    }
  };

  const handlePayDeposit = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      const response = await payDepositFn(contract.id);
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
        messageApi.info("Đang cập nhật dữ liệu...");
        // Refetch order detail to reflect any status changes
        refetchOrderDetail();
      }
    } catch (error) {
      console.error("Error paying deposit:", error);
      messageApi.error("Có lỗi xảy ra khi thanh toán đặt cọc");
    }
  };

  const handlePayFullAmount = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      const response = await payFullAmountFn(contract.id);
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
        messageApi.info("Đang cập nhật dữ liệu...");
        // Refetch order detail to reflect any status changes
        refetchOrderDetail();
      }
    } catch (error) {
      console.error("Error paying full amount:", error);
      messageApi.error("Có lỗi xảy ra khi thanh toán toàn bộ");
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
                    {!hasAdjustedValue && (
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Tổng giá trị đơn hàng"
                          value={parseContractValue(
                            contract.totalValue
                          ).toLocaleString("vi-VN")}
                          suffix="VNĐ"
                          prefix={<DollarOutlined />}
                          valueStyle={{ color: "#1890ff", fontSize: "18px", fontWeight: "600" }}
                        />
                      </Col>
                    )}

                    {hasAdjustedValue && (
                      <>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Giá niêm yết"
                            value={parseContractValue(contract.totalValue).toLocaleString(
                              "vi-VN"
                            )}
                            suffix="VNĐ"
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: "#8c8c8c", textDecoration: "line-through" }}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Giá thực tế"
                            value={parseContractValue(
                              contract.adjustedValue
                            ).toLocaleString("vi-VN")}
                            suffix="VNĐ"
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: "#722ed1", fontSize: "18px", fontWeight: "600" }}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Giá ưu đãi áp dụng cho hợp đồng này
                          </div>
                        </Col>
                      </>
                    )}

                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Số tiền cọc cần thanh toán"
                        value={depositAmount.toLocaleString("vi-VN")}
                        suffix="VNĐ"
                        prefix={<CreditCardOutlined />}
                        valueStyle={{ color: "#52c41a", fontSize: "18px", fontWeight: "bold" }}
                      />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Số tiền còn lại"
                        value={(() => {
                          const baseValue = hasAdjustedValue
                            ? parseContractValue(contract.adjustedValue)
                            : parseContractValue(contract.totalValue);
                          return (baseValue - depositAmount).toLocaleString(
                            "vi-VN"
                          );
                        })()}
                        suffix="VNĐ"
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: "#faad14", fontSize: "18px", fontWeight: "600" }}
                      />
                    </Col>
                  </Row>
                }
                type="info"
                icon={<InfoCircleOutlined />}
                showIcon
                className="payment-summary-alert"
              />
            </div>
          )}

          {/* Payment Success Notification */}
          {(contract.status === "CONTRACT_SIGNED" ||
            contract.status === "DEPOSITED" ||
            contract.status === "PAID") && (
            <div className="mb-6">
              <Alert
                message={
                  <div className="flex items-center">
                    <span className="font-semibold text-lg">
                      {contract.status === "CONTRACT_SIGNED"
                        ? "🎉 Hợp đồng đã được ký thành công!"
                        : contract.status === "DEPOSITED"
                        ? "✅ Thanh toán đặt cọc thành công!"
                        : "🎊 Thanh toán hoàn tất thành công!"}
                    </span>
                  </div>
                }
                description={
                  <div className="mt-3">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <div className="bg-white p-4 rounded border-l-4 border-l-green-500">
                          <div className="text-sm text-gray-600 mb-1">
                            Trạng thái hiện tại
                          </div>
                          <div className="font-semibold text-green-600 text-lg">
                            {contract.status === "CONTRACT_SIGNED"
                              ? "Đã ký hợp đồng"
                              : contract.status === "DEPOSITED"
                              ? "Đã đặt cọc"
                              : "Đã thanh toán"}
                          </div>
                        </div>
                      </Col>
                      {depositAmount && (
                        <Col xs={24} sm={8}>
                          <div className="bg-white p-4 rounded border-l-4 border-l-blue-500">
                            <div className="text-sm text-gray-600 mb-1">
                              {contract.status === "PAID"
                                ? "Tổng đã thanh toán"
                                : "Số tiền cọc"}
                            </div>
                            <div className="font-semibold text-blue-600 text-lg">
                              {contract.status === "PAID"
                                ? (() => {
                                    const baseValue = hasAdjustedValue
                                      ? parseContractValue(contract.adjustedValue)
                                      : parseContractValue(contract.totalValue);
                                    return (
                                      baseValue.toLocaleString("vi-VN") +
                                      " VNĐ"
                                    );
                                  })()
                                : depositAmount.toLocaleString("vi-VN") +
                                  " VNĐ"}
                            </div>
                          </div>
                        </Col>
                      )}
                      {contract.status !== "PAID" && depositAmount && (
                        <Col xs={24} sm={8}>
                          <div className="bg-white p-4 rounded border-l-4 border-l-orange-500">
                            <div className="text-sm text-gray-600 mb-1">
                              Số tiền còn lại
                            </div>
                            <div className="font-semibold text-orange-600 text-lg">
                              {(() => {
                                const baseValue = hasAdjustedValue
                                  ? parseContractValue(contract.adjustedValue)
                                  : parseContractValue(contract.totalValue);
                                return (baseValue - depositAmount).toLocaleString(
                                  "vi-VN"
                                ) + " VNĐ";
                              })()}
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>

                    {/* Status specific information */}
                    {contract.status === "CONTRACT_SIGNED" && depositAmount && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">
                              🚀 Bước tiếp theo: Thanh toán đặt cọc
                            </h4>
                            <p className="text-gray-600 mb-2">
                              Để kích hoạt hợp đồng, bạn cần thanh toán
                              số tiền đặt cọc
                            </p>
                            <div className="text-sm text-blue-700">
                              • Số tiền:{" "}
                              <strong>
                                {depositAmount.toLocaleString("vi-VN")} VNĐ
                              </strong>
                              <br />• Thời hạn: <strong>7 ngày</strong> kể từ
                              khi ký hợp đồng
                              <br />• Phương thức: Chuyển khoản ngân hàng hoặc
                              PayOS
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {contract.status === "DEPOSITED" && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-800 mb-2">
                          <span className="text-lg">✅</span>
                          <span className="font-semibold ml-2">
                            Thông tin thanh toán đặt cọc
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          • Bạn đã thanh toán thành công số tiền đặt cọc
                          <br />
                          • Hợp đồng đã được kích hoạt và có hiệu lực
                          <br />
                          • Chúng tôi sẽ bắt đầu thực hiện dịch vụ theo hợp đồng
                          <br />• Số tiền còn lại sẽ được thanh toán sau khi
                          hoàn thành dịch vụ
                        </div>
                      </div>
                    )}

                    {contract.status === "PAID" && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-800 mb-2">
                          <span className="text-lg">🎊</span>
                          <span className="font-semibold ml-2">
                            Thanh toán hoàn tất
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          • Bạn đã thanh toán đầy đủ toàn bộ giá trị hợp
                          đồng
                          <br />
                          • Tất cả dịch vụ đã được hoàn thành theo hợp đồng
                          <br />
                          • Hợp đồng đã được thực hiện thành công
                          <br />• Cảm ơn bạn đã tin tưởng và sử dụng dịch
                          vụ
                        </div>
                      </div>
                    )}
                  </div>
                }
                type="success"
                showIcon={false}
                className="border-green-200 bg-green-50"
              />
            </div>
          )}

          {/* Contract Details with Enhanced UI */}
          <div className="contract-details-section">
            {/* Contract Status and Key Dates */}
            <div className="mb-6">
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FileTextOutlined className="text-blue-500 text-xl mr-3" />
                      <h3 className="text-lg font-semibold text-gray-800">Thông tin hợp đồng</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tên hợp đồng:</span>
                        <span className="font-medium text-gray-900">{contract.contractName || "Chưa có thông tin"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Mô tả:</span>
                        <span className="font-medium text-gray-900">{contract.description || "Chưa có thông tin"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Trạng thái:</span>
                        <ContractStatusTag
                          status={contract.status as ContractStatusEnum}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Nhân viên phụ trách:</span>
                        <span className="font-medium text-gray-900">{contract.staffName || "Chưa có thông tin"}</span>
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={24} lg={12}>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-500 text-white rounded-full p-2 mr-3">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Thời hạn hiệu lực</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-green-600 font-semibold">NGÀY HIỆU LỰC</span>
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : "Chưa có thông tin"}
                        </div>
                        {contract.effectiveDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(contract.effectiveDate).toLocaleDateString('vi-VN', {
                              weekday: 'long'
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-red-600 font-semibold">NGÀY HẾT HẠN</span>
                        </div>
                        <div className="text-lg font-bold text-red-700">
                          {contract.expirationDate ? new Date(contract.expirationDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : "Chưa có thông tin"}
                        </div>
                        {contract.expirationDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(contract.expirationDate).toLocaleDateString('vi-VN', {
                              weekday: 'long'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          {/* Chi tiết giá cả và thanh toán - Hiển thị khi hợp đồng đã ký */}
          {(contract.status === "CONTRACT_SIGNED" ||
            contract.status === "DEPOSITED" ||
            contract.status === "PAID") && (
            <>
              <Divider className="mt-6" />

              {loadingPriceDetails ? (
                <div className="flex justify-center items-center py-8">
                  <Spin
                    indicator={
                      <LoadingOutlined style={{ fontSize: 36 }} spin />
                    }
                    tip="Đang tải thông tin giá cả..."
                  />
                </div>
              ) : priceDetails ? (
                <div className="border-l-4 border-green-500 pl-6 pr-4 py-2">
                  {/* Bảng tính tiền chi tiết theo từng loại xe */}
                  {priceDetails.steps && priceDetails.steps.length > 0 && (
                    <div className="mb-6">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 py-2 px-3 text-left">
                              Loại xe
                            </th>
                            <th className="border border-gray-300 py-2 px-3 text-center">
                              SL xe
                            </th>
                            <th className="border border-gray-300 py-2 px-3 text-center">
                              Khoảng cách
                            </th>
                            <th className="border border-gray-300 py-2 px-3 text-right">
                              Đơn giá (VNĐ/km)
                            </th>
                            <th className="border border-gray-300 py-2 px-3 text-center">
                              Km áp dụng
                            </th>
                            <th className="border border-gray-300 py-2 px-3 text-right">
                              Thành tiền (VNĐ)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Nhóm các steps theo sizeRuleName
                            const groupedSteps: {
                              [key: string]: typeof priceDetails.steps;
                            } = {};
                            priceDetails.steps.forEach((step) => {
                              if (!groupedSteps[step.sizeRuleName]) {
                                groupedSteps[step.sizeRuleName] = [];
                              }
                              groupedSteps[step.sizeRuleName].push(step);
                            });

                            return Object.entries(groupedSteps).map(
                              ([sizeRuleName, steps]) =>
                                steps.map((step, index) => (
                                  <tr
                                    key={`${sizeRuleName}-${index}`}
                                    className="hover:bg-gray-50"
                                  >
                                    {index === 0 && (
                                      <td
                                        className="border border-gray-300 py-2 px-3 font-semibold"
                                        rowSpan={steps.length}
                                      >
                                        {sizeRuleName}
                                      </td>
                                    )}
                                    {index === 0 && (
                                      <td
                                        className="border border-gray-300 py-2 px-3 text-center"
                                        rowSpan={steps.length}
                                      >
                                        {step.numOfVehicles}
                                      </td>
                                    )}
                                    <td className="border border-gray-300 py-2 px-3 text-center">
                                      {step.distanceRange}
                                    </td>
                                    <td className="border border-gray-300 py-2 px-3 text-right">
                                      {step.unitPrice.toLocaleString("vi-VN")}
                                    </td>
                                    <td className="border border-gray-300 py-2 px-3 text-center">
                                      {step.appliedKm.toFixed(2)}
                                    </td>
                                    <td className="border border-gray-300 py-2 px-3 text-right font-semibold">
                                      {step.subtotal.toLocaleString("vi-VN")}
                                    </td>
                                  </tr>
                                ))
                            );
                          })()}
                        </tbody>
                      </table>
                      <div className="text-xs text-gray-500 mt-2 italic">
                        * Thành tiền = Đơn giá × Km áp dụng × Số lượng xe
                      </div>
                    </div>
                  )}

                  {/* Hiển thị summary từ backend nếu có */}
                  {priceDetails.summary && (
                    <div
                      className="mb-6 whitespace-pre-line text-sm leading-relaxed p-4 bg-gray-50 rounded border border-gray-200"
                      style={{ fontFamily: "monospace" }}
                    >
                      {priceDetails.summary}
                    </div>
                  )}

                  {/* Bảng tổng kết chi tiết */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    {hasAdjustedValue ? (
                      <div>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr>
                              <td className="py-2 px-4 text-sm text-gray-600">
                                Giá niêm yết:
                              </td>
                              <td className="py-2 px-4 text-right text-gray-600 line-through">
                                {priceDetails.finalTotal.toLocaleString(
                                  "vi-VN"
                                )}{" "}
                                VNĐ
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium">
                                Giá áp dụng (tổng):
                              </td>
                              <td className="py-2 px-4 text-right font-semibold">
                                {parseContractValue(
                                  contract.adjustedValue
                                ).toLocaleString("vi-VN")}{" "}
                                VNĐ
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="text-xs text-gray-500 mt-2">
                          Lưu ý: Giá áp dụng là giá đã điều chỉnh cho hợp đồng
                          này.
                        </div>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="py-2 px-4 font-semibold">
                              Tổng tiền trước điều chỉnh:
                            </td>
                            <td className="py-2 px-4 text-right">
                              {priceDetails.totalBeforeAdjustment.toLocaleString(
                                "vi-VN"
                              )}{" "}
                              VNĐ
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-2 px-4 font-semibold">
                              Phí phụ thu loại hàng:
                            </td>
                            <td className="py-2 px-4 text-right">
                              +
                              {priceDetails.categoryExtraFee.toLocaleString(
                                "vi-VN"
                              )}{" "}
                              VNĐ
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-2 px-4 font-semibold">
                              Hệ số nhân loại hàng:
                            </td>
                            <td className="py-2 px-4 text-right">
                              x{priceDetails.categoryMultiplier}
                            </td>
                          </tr>
                          {priceDetails.promotionDiscount > 0 && (
                            <tr className="border-b border-gray-200">
                              <td className="py-2 px-4 font-semibold">
                                Giảm giá khuyến mãi:
                              </td>
                              <td className="py-2 px-4 text-right">
                                -
                                {priceDetails.promotionDiscount.toLocaleString(
                                  "vi-VN"
                                )}{" "}
                                VNĐ
                              </td>
                            </tr>
                          )}
                          <tr className="border-t border-gray-200">
                            <td className="py-3 px-4 font-bold text-base">
                              TỔNG GIÁ TRỊ HỢP ĐỒNG:
                            </td>
                            <td className="py-3 px-4 text-right font-bold">
                              {priceDetails.finalTotal.toLocaleString("vi-VN")}{" "}
                              VNĐ
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <Alert
                  message="Chưa có thông tin chi tiết giá cả"
                  type="info"
                  showIcon
                />
              )}
            </>
          )}

          {/* Action Guidance */}
          {(contract.status === "CONTRACT_DRAFT" ||
            contract.status === "PENDING") && (
            <Alert
              message="Hướng dẫn"
              description="Vui lòng xem và ký hợp đồng để tiếp tục quá trình vận chuyển."
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
          {(contract.status === "CONTRACT_SIGNED" ||
            contract.status === "UNPAID") &&
            depositAmount && (
              <Alert
                message="Bước tiếp theo"
                description={`Hợp đồng đã được ký thành công! Vui lòng thanh toán đặt cọc ${depositAmount.toLocaleString(
                  "vi-VN"
                )} VNĐ để chúng tôi bắt đầu xử lý đơn hàng.`}
                type="success"
                showIcon
                className="mt-4"
              />
            )}
          {contract.status === "DEPOSITED" &&
            orderStatus === "ASSIGNED_TO_DRIVER" && (
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
            
            {contract.attachFileUrl && contract.attachFileUrl !== "N/A" && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                href={contract.attachFileUrl}
                target="_blank"
                size="large"
              >
                Xem file đính kèm
              </Button>
            )}

                {/* Nút ký hợp đồng chỉ hiện khi có file và trạng thái phù hợp */}
            {(contract.status === "CONTRACT_DRAFT" ||
              contract.status === "PENDING") && (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={handleSignContract}
                loading={signingContract}
                size="large"
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
                {depositAmount
                  ? `Thanh Toán Đặt Cọc ${depositAmount.toLocaleString(
                      "vi-VN"
                    )} VNĐ`
                  : "Thanh Toán Đặt Cọc"}
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
                  style={{ backgroundColor: "#52c41a" }}
                >
                  Thanh Toán Toàn Bộ
                </Button>
              )}
          </div>
        </>
      ) : (
        <Empty description="Không có thông tin hợp đồng" />
      )}
    </Card>
  );
};

export default ContractSection;
