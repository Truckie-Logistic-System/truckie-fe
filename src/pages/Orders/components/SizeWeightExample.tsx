import React from "react";
import { Form, Button, Card, Typography } from "antd";
import { SizeWeightList } from "./index";

const { Title } = Typography;

const SizeWeightExample: React.FC = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    // values.sizeWeightList sẽ chứa mảng các items
    // Ví dụ: [{ value: "100x50x30 cm, 50kg" }, { value: "200x100x60 cm, 100kg" }]
  };

  return (
    <Card style={{ maxWidth: 600, margin: "20px auto" }}>
      <Title level={3}>Thông tin kích thước và trọng lượng</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          sizeWeightList: [{ value: "" }], // Khởi tạo với 1 item trống
        }}
      >
        <SizeWeightList
          name="sizeWeightList"
          label="Kích thước & Trọng lượng"
        />

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Tiếp theo
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SizeWeightExample;
