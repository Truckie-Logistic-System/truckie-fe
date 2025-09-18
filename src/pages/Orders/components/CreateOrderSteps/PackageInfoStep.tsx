import React from "react";
import { Form, InputNumber, Select, Input, Typography } from "antd";
import type { OrderSize } from "../../../../models/OrderSize";
import { formatCurrency } from "../../../../utils/formatters";

const { Title } = Typography;
const { Option } = Select;

interface PackageInfoStepProps {
  orderSizes: OrderSize[];
}

const PackageInfoStep: React.FC<PackageInfoStepProps> = ({ orderSizes }) => {
  return (
    <>
      <Title level={4}>Thông tin kích thước và trọng lượng</Title>
      <Form.Item
        name="weight"
        label="Trọng lượng (kg)"
        rules={[{ required: true, message: "Vui lòng nhập trọng lượng" }]}
      >
        <InputNumber min={0.1} step={0.1} style={{ width: "100%" }} />
      </Form.Item>

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
