import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  message,
  Space,
  Typography,
} from "antd";
import {
  FileTextOutlined,
  CalendarOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { contractService } from "../../services/contract";
import type {
  CreateContractRequest,
  Contract,
} from "../../services/contract/types";
import { formatToVietnamTime } from "../../utils/dateUtils";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Text } = Typography;

interface CreateContractFormProps {
  visible: boolean;
  onCancel: () => void;
  orderId: string;
  orderCode?: string;
  onSuccess: (contract: Contract) => void;
}

const CreateContractForm: React.FC<CreateContractFormProps> = ({
  visible,
  onCancel,
  orderId,
  orderCode,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const contractData: CreateContractRequest = {
        contractName: values.contractName,
        effectiveDate: formatToVietnamTime(values.effectiveDate.toDate()),
        expirationDate: formatToVietnamTime(values.expirationDate.toDate()),
        description: values.description,
        attachFileUrl: values.attachFileUrl || "",
        orderId: orderId,
      };

      const response = await contractService.createContract(contractData);

      if (response.success) {
        message.success("Tạo hợp đồng thành công!");
        form.resetFields();
        onSuccess(response.data);
        onCancel();
      } else {
        message.error(response.message || "Không thể tạo hợp đồng");
      }
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra khi tạo hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Set default dates (effective: today, expiration: 1 month later)
  const defaultEffectiveDate = dayjs();
  const defaultExpirationDate = dayjs().add(1, "month");

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>
            Tạo hợp đồng -{" "}
            {orderCode || `Đơn hàng ${orderId.substring(0, 8)}...`}
          </span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          effectiveDate: defaultEffectiveDate,
          expirationDate: defaultExpirationDate,
          contractName: `Hợp đồng vận chuyển - ${
            orderCode || orderId.substring(0, 8)
          }`,
        }}
      >
        <Form.Item
          label="Tên hợp đồng"
          name="contractName"
          rules={[
            { required: true, message: "Vui lòng nhập tên hợp đồng" },
            { min: 5, message: "Tên hợp đồng phải có ít nhất 5 ký tự" },
          ]}
        >
          <Input
            placeholder="Nhập tên hợp đồng"
            prefix={<FileTextOutlined />}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Ngày hiệu lực"
            name="effectiveDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày hiệu lực" }]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày hiệu lực"
              suffixIcon={<CalendarOutlined />}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            label="Ngày hết hạn"
            name="expirationDate"
            rules={[
              { required: true, message: "Vui lòng chọn ngày hết hạn" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue("effectiveDate").isBefore(value)
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Ngày hết hạn phải sau ngày hiệu lực")
                  );
                },
              }),
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày hết hạn"
              suffixIcon={<CalendarOutlined />}
              disabledDate={(current) => {
                const effectiveDate = form.getFieldValue("effectiveDate");
                return current && effectiveDate && current <= effectiveDate;
              }}
            />
          </Form.Item>
        </div>

        <Form.Item
          label="Mô tả hợp đồng"
          name="description"
          rules={[
            { required: true, message: "Vui lòng nhập mô tả hợp đồng" },
            { min: 10, message: "Mô tả phải có ít nhất 10 ký tự" },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Nhập mô tả chi tiết về hợp đồng vận chuyển..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label="Link file đính kèm"
          name="attachFileUrl"
          //   rules={[
          //     { type: 'url', message: 'Vui lòng nhập URL hợp lệ' },
          //   ]}
        >
          <Input
            placeholder="https://example.com/contract-file.pdf (tùy chọn)"
            allowClear
          />
        </Form.Item>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <Text type="secondary" className="text-sm">
            <FileTextOutlined /> Hợp đồng sẽ được tạo với trạng thái
            "CONTRACT_DRAFT" và có thể tạo PDF sau khi hoàn tất.
          </Text>
        </div>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={handleCancel}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={loading ? <LoadingOutlined /> : <FileTextOutlined />}
            >
              {loading ? "Đang tạo..." : "Tạo hợp đồng"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateContractForm;
