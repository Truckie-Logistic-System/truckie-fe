import React, { useState } from "react";
import { Form, Input, Select, Typography, DatePicker, Divider, Skeleton, App } from "antd";
import type { Category } from "../../../../models/Category";
import dayjs from "dayjs";
import ReceiverSuggestions from "./ReceiverSuggestions";
import orderService from "@/services/order/orderService";

const { Title, Text } = Typography;
const { Option } = Select;

interface ReceiverInfoStepProps {
  categories: Category[];
  onReceiverDetailsLoaded: (data: any) => void;
}

const ReceiverInfoStep: React.FC<ReceiverInfoStepProps> = ({
  categories,
  onReceiverDetailsLoaded
}) => {
  const [loadingReceiverDetails, setLoadingReceiverDetails] = useState(false);
  const { message } = App.useApp();
  const form = Form.useFormInstance();

  const handleSuggestionSelect = async (orderId: string) => {
    setLoadingReceiverDetails(true);
    try {
      const response = await orderService.getReceiverDetails(orderId);
      if (response.success) {
        const { data } = response;

        // Update form values
        form.setFieldsValue({
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
        });

        // Pass data to parent component for address fields
        onReceiverDetailsLoaded(data);

        message.success("Đã điền thông tin người nhận");
      }
    } catch (error) {
      message.error("Không thể tải thông tin người nhận");
      console.error("Error loading receiver details:", error);
    } finally {
      setLoadingReceiverDetails(false);
    }
  };

  return (
    <>
      <Title level={4}>Thông tin người nhận</Title>

      <Text className="text-gray-500 mb-2 block">
        Bạn có thể tìm kiếm người nhận gần đây để tự động điền thông tin
      </Text>

      <ReceiverSuggestions onSelect={handleSuggestionSelect} />

      <Divider className="my-4" />

      {loadingReceiverDetails ? (
        <div className="space-y-4">
          <Skeleton.Input active block style={{ height: 40 }} />
          <Skeleton.Input active block style={{ height: 40 }} />
          <Skeleton.Input active block style={{ height: 40 }} />
        </div>
      ) : (
        <>
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
      )}
    </>
  );
};

export default ReceiverInfoStep;
