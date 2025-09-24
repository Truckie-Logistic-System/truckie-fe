import React from "react";
import { Form, Input, Button, InputNumber, Select, Card, Row, Col } from "antd";
import type { FormInstance } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { OrderSize } from "../../../models/OrderSize";

interface OrderDetailFormListProps {
  name?: string;
  label?: string;
  orderSizes: OrderSize[];
  units: string[];
  form?: FormInstance;
}

const OrderDetailFormList: React.FC<OrderDetailFormListProps> = ({
  name = "orderDetailsList",
  label = "Danh sách lô hàng",
  orderSizes,
  units = [], // Empty default array, will be populated from API
}) => {
  // Convert units array to the format needed for Select component
  const weightUnits = units.map((unit) => ({
    value: unit,
    label: unit === "Kí" ? "Kilogram" : unit,
  }));

  return (
    <Form.Item label={label}>
      <Form.List
        name={name}
        initialValue={[
          { quantity: 1, unit: units.length > 0 ? units[0] : "Kí" },
        ]} // Use first unit from API if available
      >
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
                <Row gutter={12}>
                  <Col span={14}>
                    <Row gutter={12}>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "quantity"]}
                          label="Số lượng"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập số lượng!",
                            },
                            {
                              type: "number",
                              min: 1,
                              max: 100,
                              message: "Số lượng phải lớn hơn 0",
                            },
                          ]}
                          initialValue={1}
                          style={{ marginBottom: 16 }}
                        >
                          <InputNumber
                            min={1}
                            //max={100}
                            step={1}
                            placeholder="Nhập số lượng"
                            style={{ width: "90%" }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={19}>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "orderSizeId"]}
                          label="Khoảng kích thước (Dài x Cao x Rộng)"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng chọn kích thước!",
                            },
                          ]}
                          style={{ marginBottom: 16 }}
                        >
                          <Select placeholder="Chọn kích thước phù hợp">
                            {orderSizes.map((size) => (
                              <Select.Option key={size.id} value={size.id}>
                                {size.minLength} x {size.minHeight} x{" "}
                                {size.minWidth} - {size.maxLength} x{" "}
                                {size.maxHeight} x {size.maxWidth} (m)
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col span={14}>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "weight"]}
                          label="Trọng lượng"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập trọng lượng!",
                            },
                            {
                              type: "number",
                              min: 0.1,
                              message: "Trọng lượng phải lớn hơn 0",
                            },
                          ]}
                          style={{ marginBottom: 16 }}
                        >
                          <InputNumber
                            min={0.1}
                            max={10000}
                            step={0.1}
                            precision={2}
                            placeholder="Nhập trọng lượng"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "unit"]}
                          label="Đơn vị"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng chọn đơn vị!",
                            },
                          ]}
                          initialValue={units.length > 0 ? units[0] : "Kí"}
                          style={{ marginBottom: 16 }}
                        >
                          <Select placeholder="Chọn đơn vị">
                            {weightUnits.map((unit) => (
                              <Select.Option
                                key={unit.value}
                                value={unit.value}
                              >
                                {unit.label}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                  <Col span={10}>
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
                        rows={5}
                        placeholder="Mô tả chi tiết gói hàng này (ví dụ: 100x50x30 cm, đồ điện tử)"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="dashed"
                onClick={() =>
                  add({ quantity: 1, unit: units.length > 0 ? units[0] : "Kí" })
                }
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
