import React from "react";
import { Typography, Divider, Card, Tag, Row, Col, Alert, Space } from "antd";
import {
  IdcardOutlined,
  PhoneOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  InboxOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { Address } from "../../../../models/Address";
import type { Category } from "../../../../models/Category";
import type { OrderSize } from "../../../../models/OrderSize";
import { CategoryName, getCategoryDisplayName, isFragileCategory } from "../../../../models/CategoryName";
import { formatCurrency } from "../../../../utils/formatters";
import { convertWeightToTons, type WeightUnit } from "../../../../utils/weightUtils";
import dayjs from "dayjs";
import { useInsuranceRates } from "../../../../hooks";

const { Title, Text, Paragraph } = Typography;

interface OrderSummaryStepProps {
  formValues: any;
  categories: Category[];
  orderSizes: OrderSize[];
  addresses: Address[];
}

const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({
  formValues,
  categories,
  orderSizes,
  addresses,
}) => {
  // Log để debug
  // Xử lý giá trị pickupAddressId và deliveryAddressId (có thể là object hoặc string)
  const getAddressId = (addressField: any) => {
    if (!addressField) return null;
    return typeof addressField === "object" ? addressField.value : addressField;
  };

  const pickupAddressId = getAddressId(formValues.pickupAddressId);
  const deliveryAddressId = getAddressId(formValues.deliveryAddressId);

  // Format địa chỉ đầy đủ
  const formatAddress = (address: Address | undefined) => {
    if (!address) return "Không xác định";
    return `${address.street}, ${address.ward}, ${address.province}`;
  };

  // Tìm địa chỉ
  const pickupAddress = addresses.find((a) => a.id === pickupAddressId);
  const deliveryAddress = addresses.find((a) => a.id === deliveryAddressId);

  // Format thời gian
  const formatDateTime = (dateTime: any) => {
    if (!dateTime) return "Không xác định";
    if (dayjs.isDayjs(dateTime)) {
      return dateTime.format("DD/MM/YYYY HH:mm");
    }
    if (dateTime instanceof Date) {
      return dayjs(dateTime).format("DD/MM/YYYY HH:mm");
    }
    return dateTime;
  };

  // Debug: Log formValues để kiểm tra state
  console.log('🔍 OrderSummaryStep - formValues:', formValues);
  console.log('🔍 hasInsurance:', formValues.hasInsurance);
  console.log('🔍 orderDetailsList:', formValues.orderDetailsList);

  // Tính tổng trọng lượng và giá trị khai báo
  const calculateTotals = () => {
    if (!formValues.orderDetailsList || formValues.orderDetailsList.length === 0) {
      return {
        totalWeight: 0,
        totalDeclaredValue: 0,
        totalPackages: 0,
        displayUnit: 'Tấn'
      };
    }

    const totals = formValues.orderDetailsList.reduce(
      (acc: any, detail: any) => {
        const weight = parseFloat(detail.weightBaseUnit || detail.weight || 0);
        const quantity = parseInt(detail.quantity || 1);
        const declaredValue = parseFloat(detail.declaredValue || 0);
        const unit = detail.unit || 'Tấn';

        // Use existing utility function to convert to tons for calculation
        const weightInTons = convertWeightToTons(weight, unit as WeightUnit);

        return {
          totalWeight: acc.totalWeight + (weightInTons * quantity),
          totalDeclaredValue: acc.totalDeclaredValue + (declaredValue * quantity),
          totalPackages: acc.totalPackages + quantity,
          displayUnit: unit // Keep track of the unit for display
        };
      },
      { totalWeight: 0, totalDeclaredValue: 0, totalPackages: 0, displayUnit: 'Tấn' }
    );

    return totals;
  };

  const totals = calculateTotals();

  // Function to determine display unit and format total weight
  const formatTotalWeight = () => {
    if (!formValues.orderDetailsList || formValues.orderDetailsList.length === 0) {
      return { value: 0, unit: 'Tấn' };
    }

    // Check if all items use the same unit
    const units = formValues.orderDetailsList.map((detail: any) => detail.unit || 'Tấn');
    const allSameUnit = units.every((unit: string) => unit === units[0]);
    
    if (allSameUnit) {
      // If all units are the same, use that unit
      const unit = units[0];
      let totalValue = 0;
      
      formValues.orderDetailsList.forEach((detail: any) => {
        // Use weightBaseUnit which should be the converted value in the base unit
        const weight = parseFloat(detail.weightBaseUnit || detail.weight || 0);
        const quantity = parseInt(detail.quantity || 1);
        totalValue += weight * quantity;
      });
      
      // Auto-convert to more readable unit if value gets too large
      if ((unit === 'Kí' || unit === 'Kilogram') && totalValue >= 1000) {
        return { value: totalValue / 1000, unit: 'Tấn' };
      } else if (unit === 'Tạ' && totalValue >= 10) {
        return { value: totalValue / 10, unit: 'Tấn' };
      } else if (unit === 'Yến' && totalValue >= 100) {
        return { value: totalValue / 100, unit: 'Tấn' };
      }
      
      return { value: totalValue, unit };
    } else {
      // If mixed units, convert to tons and display in tons
      return { value: totals.totalWeight, unit: 'Tấn' };
    }
  };

  // Format weight value with appropriate decimal precision
  const formatWeightValue = (value: number, unit: string) => {
    switch (unit) {
      case 'Tấn':
        return value.toFixed(2);
      case 'Tạ':
        return value.toFixed(1);
      case 'Kí':
      case 'Kilogram':
        return value.toFixed(0);
      case 'Yến':
        return value.toFixed(0);
      default:
        return value.toFixed(2);
    }
  };

  const totalWeightDisplay = formatTotalWeight();

  // Tính toán thông tin bảo hiểm
  const { rates, normalRatePercent, fragileRatePercent, normalRatePercentBase, fragileRatePercentBase, vatRatePercent } = useInsuranceRates();
  const calculateInsuranceInfo = () => {
    if (!formValues.hasInsurance || !totals.totalDeclaredValue || totals.totalDeclaredValue <= 0) {
      return {
        hasInsurance: false,
        totalFee: 0,
        totalValue: 0,
        isFragile: false,
        ratePercent: 0,
        baseRatePercent: 0
      };
    }

    const selectedCategory = categories.find((c) => c.id === formValues.categoryId);
    const isFragile = selectedCategory ? isFragileCategory(selectedCategory.categoryName) : false;
    const insuranceRate = isFragile ? rates.fragileRate : rates.normalRate; // Already includes VAT
    const ratePercent = isFragile ? fragileRatePercent : normalRatePercent; // Already includes VAT
    const baseRatePercent = isFragile ? fragileRatePercentBase : normalRatePercentBase; // Without VAT
    const totalFee = totals.totalDeclaredValue * insuranceRate;

    return {
      hasInsurance: true,
      totalFee,
      totalValue: totals.totalDeclaredValue,
      isFragile,
      ratePercent,
      baseRatePercent
    };
  };

  const insuranceInfo = calculateInsuranceInfo();

  return (
    <>
      <Alert
        message="Xác nhận thông tin đơn hàng"
        description="Vui lòng kiểm tra kỹ thông tin đơn hàng trước khi xác nhận. Sau khi xác nhận, đơn hàng sẽ được gửi đi và không thể chỉnh sửa."
        type="info"
        showIcon
        icon={<CheckCircleOutlined />}
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thông tin người nhận */}
        <Card title="Thông tin người nhận" className="shadow-sm" size="small">
          <div className="space-y-2">
            <div className="flex items-start">
              <IdcardOutlined className="text-blue-500 mt-1 mr-2" />
              <div>
                <Text strong className="block text-sm">Tên người nhận</Text>
                <Text>{formValues.receiverName || "Chưa cung cấp"}</Text>
              </div>
            </div>

            <div className="flex items-start">
              <PhoneOutlined className="text-blue-500 mt-1 mr-2" />
              <div>
                <Text strong className="block text-sm">Số điện thoại</Text>
                <Text>{formValues.receiverPhone || "Chưa cung cấp"}</Text>
              </div>
            </div>

            <div className="flex items-start">
              <IdcardOutlined className="text-blue-500 mt-1 mr-2" />
              <div>
                <Text strong className="block text-sm">CMND/CCCD</Text>
                <Text>{formValues.receiverIdentity || "Chưa cung cấp"}</Text>
              </div>
            </div>

            <div className="flex items-start">
              <ShopOutlined className="text-blue-500 mt-1 mr-2" />
              <div className="flex-1">
                <Text strong className="block text-sm">Loại hàng hóa</Text>
                <Space>
                  <Text>
                    {(() => {
                      const category = categories.find((c) => c.id === formValues.categoryId);
                      return category ? getCategoryDisplayName(category.categoryName) : "Không xác định";
                    })()}
                  </Text>
                  {/* {(() => {
                    const category = categories.find((c) => c.id === formValues.categoryId);
                    const isFragile = category ? isFragileCategory(category.categoryName) : false;
                    return isFragile ? (
                      <Tag color="orange">
                        Dễ vỡ
                      </Tag>
                    ) : null;
                  })()} */}
                </Space>
              </div>
            </div>
          </div>
        </Card>

        {/* Thông tin địa chỉ */}
        <Card title="Thông tin địa chỉ" className="shadow-sm" size="small">
          <div className="space-y-3">
            <div className="bg-blue-50 p-2 rounded-md">
              <div className="flex items-start">
                <EnvironmentOutlined className="text-blue-500 mt-1 mr-2" />
                <div>
                  <Text strong className="block text-sm">Địa chỉ lấy hàng</Text>
                  <Text className="text-sm">{formatAddress(pickupAddress)}</Text>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-2 rounded-md">
              <div className="flex items-start">
                <EnvironmentOutlined className="text-red-500 mt-1 mr-2" />
                <div>
                  <Text strong className="block text-sm">Địa chỉ giao hàng</Text>
                  <Text className="text-sm">{formatAddress(deliveryAddress)}</Text>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Thông tin bổ sung */}
        <Card title="Thông tin bổ sung" className="shadow-sm" size="small">
          <div className="space-y-2">
            <div className="flex items-start">
              <CalendarOutlined className="text-blue-500 mt-1 mr-2" />
              <div>
                <Text strong className="block text-sm">Thời gian nhận hàng</Text>
                <Text>{formatDateTime(formValues.estimateStartTime)}</Text>
              </div>
            </div>

            <div className="flex items-start">
              <FileTextOutlined className="text-blue-500 mt-1 mr-2" />
              <div>
                <Text strong className="block text-sm">Mô tả đơn hàng</Text>
                <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: "Xem thêm" }} className="text-sm mb-1">
                  {formValues.packageDescription || "Không có mô tả"}
                </Paragraph>
              </div>
            </div>

            <div className="flex items-start">
              <InfoCircleOutlined className="text-blue-500 mt-1 mr-2" />
              <div>
                <Text strong className="block text-sm">Ghi chú</Text>
                <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: "Xem thêm" }} className="text-sm mb-1">
                  {formValues.notes || "Không có ghi chú"}
                </Paragraph>
              </div>
            </div>
          </div>
        </Card>

        {/* Thông tin kiện hàng */}
        <Card title="Thông tin kiện hàng" className="shadow-sm md:col-span-3" size="small">
          {formValues.orderDetailsList &&
            formValues.orderDetailsList.length > 0 ? (
            <div>
              {/* Hiển thị tổng quan */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Text strong className="block text-sm text-blue-700">Tổng số kiện</Text>
                    <Text className="text-lg font-semibold text-blue-800">
                      {totals.totalPackages} kiện
                    </Text>
                  </div>
                  <div>
                    <Text strong className="block text-sm text-blue-700">Tổng trọng lượng</Text>
                    <Text className="text-lg font-semibold text-blue-800">
                      {formatWeightValue(totalWeightDisplay.value, totalWeightDisplay.unit).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} {totalWeightDisplay.unit}
                    </Text>
                  </div>
                  <div>
                    <Text strong className="block text-sm text-blue-700">Tổng giá trị khai báo</Text>
                    <Text className="text-lg font-semibold text-blue-800">
                      {formatCurrency(totals.totalDeclaredValue)}
                    </Text>
                  </div>
                  <div>
                    <Text strong className="block text-sm text-blue-700">Loại hàng</Text>
                    <Space>
                      <Text className="text-lg font-semibold text-blue-800">
                        {(() => {
                          const category = categories.find((c) => c.id === formValues.categoryId);
                          return category ? getCategoryDisplayName(category.categoryName) : "Không xác định";
                        })()}
                      </Text>
                      {/* {(() => {
                        const category = categories.find((c) => c.id === formValues.categoryId);
                        const isFragile = category ? isFragileCategory(category.categoryName) : false;
                        return isFragile ? (
                          <Tag color="orange">Dễ vỡ</Tag>
                        ) : null;
                      })()} */}
                    </Space>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formValues.orderDetailsList.map((detail: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center mb-2">
                      <Tag color="blue" className="mr-2">
                        Kiện hàng {index + 1}
                      </Tag>
                      <Text strong>Kích thước & Trọng lượng</Text>
                    </div>
                    <Row gutter={[8, 8]}>
                      <Col span={8}>
                        <Text strong className="block text-sm">Trọng lượng</Text>
                        <Text>{detail.weightBaseUnit || detail.weight} {detail.unit || "kg"}</Text>
                      </Col>
                      <Col span={8}>
                        <Text strong className="block text-sm">Số lượng</Text>
                        <Text className="text-blue-600 font-semibold">
                          {detail.quantity || 1}
                        </Text>
                      </Col>
                      <Col span={8}>
                        <Text strong className="block text-sm">Kích thước</Text>
                        <Text className="text-sm">
                          {(() => {
                            const size = orderSizes.find(
                              (s) => s.id === detail.orderSizeId
                            );
                            if (!size) return "Không xác định";
                            return `${size.minLength}-${size.maxLength} x ${size.minHeight}-${size.maxHeight} x ${size.minWidth}-${size.maxWidth} (m)`;
                          })()}
                        </Text>
                      </Col>
                      <Col span={24}>
                        <Text strong className="block text-sm">Giá trị khai báo</Text>
                        <Text className="text-sm font-semibold text-green-600">
                          {formatCurrency(detail.declaredValue || 0)}
                        </Text>
                      </Col>
                      <Col span={24}>
                        <Text strong className="block text-sm">Mô tả chi tiết</Text>
                        <Paragraph
                          ellipsis={{
                            rows: 2,
                            expandable: true,
                            symbol: "Xem thêm",
                          }}
                          className="text-sm mb-0"
                        >
                          {detail.description || "Không có mô tả"}
                        </Paragraph>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Text>Chưa có thông tin kiện hàng</Text>
            </div>
          )}
        </Card>

        {/* Thông tin bảo hiểm */}
        <Card 
          title={
            <Space>
              <SafetyCertificateOutlined className="text-green-500" />
              <span>Thông tin bảo hiểm hàng hóa</span>
            </Space>
          } 
          className="shadow-sm md:col-span-3" 
          size="small"
        >
          {insuranceInfo.hasInsurance ? (
            <div>
              <Alert
                message="Đã đăng ký bảo hiểm hàng hóa"
                description="Hàng hóa của bạn được bảo vệ theo chính sách bảo hiểm của chúng tôi."
                type="success"
                showIcon
                className="mb-3"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <InboxOutlined className="text-green-600 mr-2" />
                    <Text strong className="text-green-700">Tổng giá trị bảo hiểm</Text>
                  </div>
                  <Text className="text-xl font-bold text-green-800">
                    {formatCurrency(insuranceInfo.totalValue)}
                  </Text>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <DollarOutlined className="text-blue-600 mr-2" />
                    <Text strong className="text-blue-700">Phí bảo hiểm</Text>
                  </div>
                  <Text className="text-xl font-bold text-blue-800">
                    {formatCurrency(insuranceInfo.totalFee)}
                  </Text>
                  <Text className="block text-xs text-blue-600 mt-1">
                    Tỷ lệ: {insuranceInfo.ratePercent.toFixed(3)}% ({insuranceInfo.isFragile ? "Hàng dễ vỡ" : "Hàng thường"}, đã bao gồm VAT)
                  </Text>
                  <Text className="block text-xs text-blue-600">
                    = {insuranceInfo.totalValue.toLocaleString("vi-VN")} × {insuranceInfo.ratePercent.toFixed(3)}%
                  </Text>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <div className="flex items-center mb-2">
                    <WarningOutlined className="text-orange-600 mr-2" />
                    <Text strong className="text-orange-700">Mức bồi thường tối đa ước tính cho giá trị hàng hóa</Text>
                  </div>
                  <Text className="text-xl font-bold text-orange-800">
                    {formatCurrency(insuranceInfo.totalValue)}
                  </Text>
                  <Text className="block text-xs text-orange-600 mt-1">
                    Khi có đầy đủ chứng từ hợp lệ
                  </Text>
                </div>
              </div>

              <Alert
                message="Lưu ý quan trọng về bảo hiểm"
                description={
                  <div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Khi xảy ra sự cố, bạn cần cung cấp hóa đơn VAT hoặc chứng từ mua bán hợp pháp để chứng minh giá trị hàng hóa</li>
                      <li>Nếu không có chứng từ hợp lệ, bảo hiểm sẽ bị vô hiệu hóa và bồi thường tối đa 10 lần cước phí vận chuyển</li>
                      <li>Phải báo cáo sự cố ngay tại thời điểm nhận hàng</li>
                    </ul>
                  </div>
                }
                type="warning"
                showIcon
                className="mt-3"
              />
            </div>
          ) : (
            <div>
              <Alert
                message="Chưa đăng ký bảo hiểm hàng hóa"
                description="Hàng hóa của bạn chưa được bảo hiểm. Rủi ro sẽ được giải quyết theo giới hạn pháp lý (tối đa 10 lần cước phí vận chuyển)."
                type="warning"
                showIcon
                className="mb-3"
              />
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <WarningOutlined className="text-gray-600 mr-2" />
                  <Text strong className="text-gray-700">Mức bồi thường khi không có bảo hiểm</Text>
                </div>
                <Text className="text-lg font-semibold text-gray-800">
                  Tối đa 10 × Cước phí vận chuyển
                </Text>
                <Text className="block text-sm text-gray-600 mt-1">
                  Theo Điều 546 Luật Thương mại 2005
                </Text>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Alert
        message="Bạn đã sẵn sàng tạo đơn hàng?"
        description="Nhấn 'Tạo đơn hàng' để hoàn tất quá trình và gửi đơn hàng của bạn."
        type="success"
        showIcon
        className="mt-4"
      />
    </>
  );
};

export default OrderSummaryStep;
