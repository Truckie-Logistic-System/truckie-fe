import React from "react";
import { Form, Input, Select, Typography, DatePicker } from "antd";
import type { Category } from "../../../../models/Category";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;

interface ReceiverInfoStepProps {
  categories: Category[];
}

const ReceiverInfoStep: React.FC<ReceiverInfoStepProps> = ({ categories }) => {
  return (
    <>
      <Title level={4}>Thông tin người nhận</Title>
      <Form.Item
        name="receiverName"
        label="Tên người nhận"
        rules={[{ required: true, message: "Vui lòng nhập tên người nhận" }]}
      >
        <Input placeholder="Nhập tên người nhận" />
      </Form.Item>

      <Form.Item
        name="receiverPhone"
        label="Số điện thoại người nhận"
        rules={[
          { required: true, message: "Vui lòng nhập số điện thoại người nhận" },
          {
            pattern: /^[0-9]{10}$/,
            message: "Số điện thoại phải có 10 chữ số",
          },
        ]}
      >
        <Input placeholder="Nhập số điện thoại người nhận" />
      </Form.Item>

      <Form.Item
        name="categoryId"
        label="Loại hàng hóa"
        rules={[{ required: true, message: "Vui lòng chọn loại hàng hóa" }]}
      >
        <Select placeholder="Chọn loại hàng hóa">
          {categories.map((category) => (
            <Option key={category.id} value={category.id}>
              {category.categoryName}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="packageDescription"
        label="Mô tả đơn hàng"
        rules={[{ required: true, message: "Vui lòng nhập mô tả đơn hàng" }]}
      >
        <Input.TextArea rows={4} placeholder="Mô tả chi tiết về đơn hàng" />
      </Form.Item>

      <Form.Item
        name="estimateStartTime"
        label="Thời gian nhận hàng dự kiến"
        rules={[
          { required: true, message: "Vui lòng chọn thời gian nhận hàng" },
        ]}
      >
        <DatePicker
          showTime
          placeholder="Chọn ngày và giờ nhận hàng"
          style={{ width: "100%" }}
          disabledDate={(current) =>
            current && current < dayjs().startOf("day")
          }
          format="DD/MM/YYYY HH:mm"
        />
      </Form.Item>
    </>
  );
};

export default ReceiverInfoStep;
