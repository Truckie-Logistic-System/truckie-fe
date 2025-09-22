import React from "react";
import { Form, InputNumber, Select, Input, Typography, Row, Col } from "antd";
import type { OrderSize } from "../../../../models/OrderSize";
import { formatCurrency } from "../../../../utils/formatters";

const { Title } = Typography;
const { Option } = Select;

interface PackageInfoStepProps {
  orderSizes: OrderSize[];
}

const PackageInfoStep: React.FC<PackageInfoStepProps> = ({ orderSizes }) => {
  const weightUnits = [
    { value: "Kí", label: "Kilogram (kg)" },
    { value: "Yến", label: "Yến" },
    { value: "Tạ", label: "Tạ" },
    { value: "Tấn", label: "Tấn" },
  ];

  return (
    <>
      <Title level={4}>Thông tin kích thước và trọng lượng</Title>

      {/* Weight and Unit Selection */}
      <Row gutter={16}>
        <Col span={16}>
          <Form.Item
            name="weight"
            label="Trọng lượng"
            rules={[
              { required: true, message: "Vui lòng nhập trọng lượng" },
              {
                type: "number",
                min: 0.1,
                message: "Trọng lượng phải lớn hơn 0",
              },
            ]}
          >
            <InputNumber
              min={0.1}
              step={0.1}
              precision={2}
              style={{ width: "100%" }}
              placeholder="Nhập trọng lượng"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="weightUnit"
            label="Đơn vị"
            rules={[{ required: true, message: "Vui lòng chọn đơn vị" }]}
            initialValue="Kí"
          >
            <Select placeholder="Chọn đơn vị">
              {weightUnits.map((unit) => (
                <Option key={unit.value} value={unit.value}>
                  {unit.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="orderSizeId"
        label="Kích thước"
        rules={[{ required: true, message: "Vui lòng chọn kích thước" }]}
      >
        <Select placeholder="Chọn kích thước lô hàng">
          {orderSizes.map((size) => (
            <Option key={size.id} value={size.id}>
              {size.minWidth} - {size.maxWidth} x {size.minLength} -{" "}
              {size.maxLength} x {size.minHeight} - {size.maxHeight} /{" "}
              {formatCurrency(size.price || 0)}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả kích thước"
        rules={[{ required: true, message: "Vui lòng nhập mô tả kích thước" }]}
      >
        <Input.TextArea
          rows={3}
          placeholder="Mô tả chi tiết về kích thước lô hàng"
        />
      </Form.Item>
    </>
  );
};

export default PackageInfoStep;
