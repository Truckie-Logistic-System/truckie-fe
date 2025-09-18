import React from "react";
import { Form, Input, Button, InputNumber, Select, Card } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { OrderSize } from "../../../models/OrderSize";

interface OrderDetailFormListProps {
  name?: string;
  label?: string;
  orderSizes: OrderSize[];
  units: string[];
}

const OrderDetailFormList: React.FC<OrderDetailFormListProps> = ({
  name = "orderDetailsList",
  label = "Danh sách lô hàng",
  orderSizes,
  units = ["Kí", "Yến", "Tạ", "Tấn"], // Default units if API fails
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
                title={`Lô hàng ${index + 1}`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Form.Item
                    {...restField}
                    name={[fieldName, "weight"]}
                    label="Trọng lượng"
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
                    name={[fieldName, "unit"]}
                    label="Đơn vị"
                    initialValue={units[0] || "kg"}
                    rules={[
                      { required: true, message: "Vui lòng chọn đơn vị!" },
                    ]}
                    style={{ marginBottom: 16 }}
                  >
                    <Select placeholder="Chọn đơn vị">
                      {units.map((unit) => (
                        <Select.Option key={unit} value={unit}>
                          {unit}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[fieldName, "quantity"]}
                    label="Số lượng"
                    initialValue={1}
                    rules={[
                      { required: true, message: "Vui lòng nhập số lượng!" },
                    ]}
                    style={{ marginBottom: 16 }}
                    tooltip="Số lượng lô hàng giống hệt nhau"
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      step={1}
                      placeholder="Nhập số lượng"
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
                          {size.minWidth} - {size.maxWidth} x {size.minLength} -{" "}
                          {size.maxLength} x {size.minHeight} - {size.maxHeight}{" "}
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
                    className="md:col-span-2 lg:col-span-4"
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Mô tả chi tiết lô hàng này (ví dụ: 100x50x30 cm, đồ điện tử)"
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
                Thêm lô hàng mới
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
};

export default OrderDetailFormList;
