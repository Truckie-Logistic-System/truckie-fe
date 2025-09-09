import React from "react";
import { Form, Input, Button, InputNumber, Select, Card } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { OrderSize } from "../../../models/OrderSize";

interface OrderDetailFormListProps {
  name?: string;
  label?: string;
  orderSizes: OrderSize[];
}

const OrderDetailFormList: React.FC<OrderDetailFormListProps> = ({
  name = "orderDetailsList",
  label = "Danh sách gói hàng",
  orderSizes,
}) => {
  return (
    <Form.Item label={label}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name: fieldName, ...restField }, index) => (
              <Card
                key={key}
                size="small"
                title={`Gói hàng ${index + 1}`}
                extra={
                  fields.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(fieldName)}
                      size="small"
                    >
                      Xóa
                    </Button>
                  )
                }
                style={{ marginBottom: 16 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Form.Item
                    {...restField}
                    name={[fieldName, "weight"]}
                    label="Trọng lượng (kg)"
                    rules={[
                      { required: true, message: "Vui lòng nhập trọng lượng!" },
                    ]}
                    style={{ marginBottom: 16 }}
                  >
                    <InputNumber
                      min={0.1}
                      max={10000}
                      step={0.1}
                      placeholder="Nhập trọng lượng"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[fieldName, "orderSizeId"]}
                    label="Kích thước"
                    rules={[
                      { required: true, message: "Vui lòng chọn kích thước!" },
                    ]}
                    style={{ marginBottom: 16 }}
                  >
                    <Select placeholder="Chọn kích thước">
                      {orderSizes.map((size) => (
                        <Select.Option key={size.id} value={size.id}>
                          {size.name} - {size.description}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[fieldName, "description"]}
                    label="Mô tả chi tiết"
                    rules={[
                      { required: true, message: "Vui lòng nhập mô tả!" },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea
                      rows={1}
                      placeholder="Mô tả chi tiết gói hàng này (ví dụ: 100x50x30 cm, đồ điện tử)"
                    />
                  </Form.Item>
                </div>
              </Card>
            ))}

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                size="large"
              >
                Thêm gói hàng mới
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
};

export default OrderDetailFormList;
