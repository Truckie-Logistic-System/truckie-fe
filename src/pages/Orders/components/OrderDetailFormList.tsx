import React from "react";
import { Form, Input, Button, InputNumber, Select, Card, Row, Col, Alert, Progress, Radio, Tag, Typography } from "antd";
import type { FormInstance } from "antd";
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { OrderSize } from "../../../models/OrderSize";
import type { Category } from "../../../models/Category";
import { CategoryName, getCategoryDisplayName, isFragileCategory } from "../../../models/CategoryName";
import { convertWeightToTons, getWeightValidation, getWeightRangeLabel, calculateTotalWeight, type WeightUnit } from "../../../utils/weightUtils";
import { getWeightUnits } from "../../../config/weightUnits";

const { Text } = Typography;

interface OrderDetailFormListProps {
  name?: string;
  label?: string;
  categories: Category[];
  orderSizes: OrderSize[];
  form?: FormInstance;
}

const OrderDetailFormList: React.FC<OrderDetailFormListProps> = ({
  name = "orderDetailsList",
  label = "Danh sách kiện hàng",
  categories,
  orderSizes,
  form,
}) => {
  // Watch all order details to calculate total weight in real-time
  const orderDetails = Form.useWatch(name, form) || [];
  
  // Calculate total weight using utility function
  const totalWeight = calculateTotalWeight(orderDetails);

  // Validation states
  const isUnderMin = totalWeight < 0.01;
  const isOverMax = totalWeight > 50;
  const isValid = totalWeight >= 0.01 && totalWeight <= 50;

  // Use weight units from configuration instead of props
  const weightUnits = getWeightUnits();

  return (
    <>
      {/* Category Selection */}
      <Alert
        message="Quy định về phân loại hàng hóa"
        description={
          <Text type="secondary">
            Mỗi đơn hàng chỉ được đăng ký cho một loại hàng hóa duy nhất.
            Vui lòng lựa chọn loại hàng phù hợp với toàn bộ kiện hàng trong đơn hàng của bạn.
          </Text>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="categoryId"
        label="Loại hàng hóa"
        rules={[{ required: true, message: "Vui lòng chọn loại hàng hóa" }]}
      >
        <Radio.Group>
          <Row gutter={[16, 8]}>
            {categories.map((category) => (
              <Col key={category.id} span={24}>
                <Radio value={category.id}>
                  <span>
                    <Text>{getCategoryDisplayName(category.categoryName)}</Text>
                    {/* {isFragileCategory(category.categoryName) && (
                      <Tag color="orange">
                        Dễ vỡ
                      </Tag>
                    )} */}
                  </span>
                </Radio>
              </Col>
            ))}
          </Row>
        </Radio.Group>
      </Form.Item>

      <Form.Item label={
        <span>
          {label}
          <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
            (Tổng khối lượng: 0.01 - 50 tấn)
          </span>
        </span>
      }>
      <Form.List
        name={name}
        initialValue={[
          { quantity: 1, unit: "Tấn" },
        ]} // Default to Tấn
      >
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name: fieldName, ...restField }, index) => {
              // Access unit from orderDetails array instead of calling useWatch inside map
              const currentUnit = orderDetails[index]?.unit || "Tấn";
              
              // Use utility function for validation
              const weightValidation = getWeightValidation(currentUnit as WeightUnit);
              const weightRangeLabel = getWeightRangeLabel(currentUnit as WeightUnit);

              return (
              <Card
                key={key}
                size="small"
                title={`Kiện hàng ${index + 1}`}
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
                <Row gutter={24}>
                  <Col span={16}>
                    <Row gutter={12}>
                      <Col span={6}>
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
                      <Col span={18}>
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
                                <div className="flex justify-between items-center">
                                  <span>
                                    {size.minLength} x {size.minHeight} x{" "}
                                    {size.minWidth} - {size.maxLength} x{" "}
                                    {size.maxHeight} x {size.maxWidth} (m)
                                  </span>
                                  {size.description && (
                                    <span className="text-gray-500 text-sm ml-2">
                                      ({size.description})
                                    </span>
                                  )}
                                </div>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "weight"]}
                          label={
                            <span>
                              Trọng lượng
                              <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                                ({weightRangeLabel})
                              </span>
                            </span>
                          }
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập trọng lượng!",
                            },
                            {
                              type: "number",
                              min: weightValidation.min,
                              max: weightValidation.max,
                              message: weightValidation.message,
                            },
                          ]}
                          style={{ marginBottom: 16 }}
                        >
                          <InputNumber
                            min={weightValidation.min}
                            max={weightValidation.max}
                            step={weightValidation.step}
                            precision={weightValidation.precision}
                            placeholder={weightValidation.placeholder}
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
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
                          initialValue={weightUnits.length > 0 ? weightUnits[0].value : "Tấn"}
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
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "declaredValue"]}
                          label="Giá trị khai báo (VNĐ)"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập giá trị khai báo!",
                            },
                            {
                              type: "number",
                              min: 0,
                              message: "Giá trị phải >= 0",
                            },
                          ]}
                          tooltip="Giá trị hàng hóa theo hóa đơn/chứng từ - dùng để tính phí bảo hiểm"
                          style={{ marginBottom: 16 }}
                        >
                          <InputNumber
                            min={0}
                            step={100000}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value: string | undefined) => (value ? parseFloat(value.replace(/,/g, '')) : 0) as 0}
                            placeholder="Ví dụ: 10,000,000"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[fieldName, "description"]}
                      label="Mô tả chi tiết"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập mô tả chi tiết về kiện hàng!",
                        },
                        {
                          whitespace: true,
                          message: "Mô tả không được để trống!",
                        },
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <Input.TextArea
                        placeholder="Nhập mô tả chi tiết về kiện hàng (ví dụ: hàng dễ vỡ, hàng điện tử, quần áo...)"
                        rows={4}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
              );
            })}

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="dashed"
                onClick={() =>
                  add({ quantity: 1, unit: "Tấn" })
                }
                block
                icon={<PlusOutlined />}
                size="large"
              >
                Thêm kiện hàng mới
              </Button>
            </Form.Item>

            {/* Total Weight Validation Component */}
            <Card 
              size="small" 
              style={{ 
                marginTop: 16, 
                border: isValid ? '1px solid #d9d9d9' : '1px solid #ff4d4f',
                backgroundColor: isValid ? '#fafafa' : '#fff2f0'
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <Row align="middle" justify="space-between">
                  <Col>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      📊 Tổng khối lượng: <span style={{ color: isValid ? '#52c41a' : '#ff4d4f' }}>
                        {totalWeight.toFixed(2)} / 50.00 tấn
                      </span>
                    </span>
                  </Col>
                  <Col>
                    {!isValid && (
                      <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                        {isUnderMin ? '⚠️ Tối thiểu 0.01 tấn' : '⚠️ Tối đa 50 tấn'}
                      </span>
                    )}
                  </Col>
                </Row>
              </div>
              
              {/* Progress Bar */}
              <Progress 
                percent={Math.min((totalWeight / 50) * 100, 100)} 
                status={isOverMax ? 'exception' : isValid ? 'success' : 'active'}
                strokeWidth={8}
                showInfo={false}
                style={{ marginBottom: 12 }}
              />

              {/* Helpful Information */}
              <Alert
                message="Lưu ý quan trọng"
                description={
                  <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <div>• Mỗi kiện hàng: 0.01 - 10 tấn</div>
                    <div>• Tổng đơn hàng: 0.01 - 50 tấn</div>
                    <div>• Nếu khối lượng &gt; 10 tấn, hệ thống sẽ tự động phân bổ nhiều xe</div>
                    <div>• Khối lượng tối đa mỗi xe: 10 tấn (giới hạn vận tải)</div>
                  </div>
                }
                type="info"
                icon={<InfoCircleOutlined />}
                style={{ fontSize: '12px' }}
              />
            </Card>
          </>
        )}
      </Form.List>
    </Form.Item>
    </>
  );
};

export default OrderDetailFormList;
