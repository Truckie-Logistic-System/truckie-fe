import React from "react";
import { Typography, Divider, Card, Tag, Row, Col, Alert } from "antd";
import {
  IdcardOutlined,
  PhoneOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { Address } from "../../../../models/Address";
import type { Category } from "../../../../models/Category";
import type { OrderSize } from "../../../../models/OrderSize";
import dayjs from "dayjs";

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
  console.log("OrderSummaryStep - formValues:", formValues);
  console.log(
    "OrderSummaryStep - orderDetailsList:",
    formValues.orderDetailsList
  );

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
              <div>
                <Text strong className="block text-sm">Loại hàng hóa</Text>
                <Text>
                  {categories.find((c) => c.id === formValues.categoryId)
                    ?.categoryName || "Không xác định"}
                </Text>
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

        {/* Thông tin lô hàng */}
        <Card title="Thông tin lô hàng" className="shadow-sm md:col-span-3" size="small">
          {formValues.orderDetailsList &&
            formValues.orderDetailsList.length > 0 ? (
            <div>
              {/* Hiển thị tổng quan */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Text strong className="text-blue-700">
                  Tổng cộng:{" "}
                  {formValues.orderDetailsList.reduce(
                    (total: number, detail: any) =>
                      total + (detail.quantity || 1),
                    0
                  )}{" "}
                  kiện hàng
                </Text>
                <Text className="block text-sm text-blue-600">
                  Từ {formValues.orderDetailsList.length} lô hàng khác nhau
                </Text>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formValues.orderDetailsList.map((detail: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center mb-2">
                      <Tag color="blue" className="mr-2">
                        Lô hàng {index + 1}
                      </Tag>
                      <Text strong>Kích thước & Trọng lượng</Text>
                    </div>
                    <Row gutter={[8, 8]}>
                      <Col span={8}>
                        <Text strong className="block text-sm">Trọng lượng</Text>
                        <Text>{detail.weight} {detail.unit || "kg"}</Text>
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
              <Text>Chưa có thông tin lô hàng</Text>
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
