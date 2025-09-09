import React from "react";
import { Form, Input, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface SizeWeightListProps {
  name?: string;
  label?: string;
}

const SizeWeightList: React.FC<SizeWeightListProps> = ({
  name = "sizeWeightList",
  label = "Kích thước & Trọng lượng",
}) => {
  return (
    <Form.Item
      label={label}
      // Không bắt buộc vì đây là trường bổ sung
    >
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name: fieldName, ...restField }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  marginBottom: 8,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Form.Item
                  {...restField}
                  name={[fieldName, "value"]}
                  style={{ flex: 1, marginBottom: 0 }}
                  rules={[
                    { required: true, message: "Vui lòng nhập thông tin!" },
                  ]}
                >
                  <Input placeholder="Ví dụ: 100x50x30 cm, 50kg" />
                </Form.Item>
                {fields.length > 1 && (
                  <Button
                    type="text"
                    danger
                    onClick={() => remove(fieldName)}
                    style={{ marginBottom: 0 }}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            ))}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Thêm mục kích thước & trọng lượng
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
};

export default SizeWeightList;
