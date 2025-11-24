import React, { useState } from "react";
import {
  Button,
  Modal,
  Table,
  Tag,
  Typography,
  message,
  Space,
  Card,
} from "antd";
import {
  TruckOutlined,
  EyeOutlined,
  LoadingOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useSuggestVehicles } from "../../hooks/useSuggestVehicles";
import type { Contract } from "../../services/contract/types";
import CreateContractForm from "./CreateContractForm";
import ContractInfo from "./ContractInfo";

const { Title, Text } = Typography;

interface SuggestAssignVehiclesProps {
  orderId: string;
  orderCode?: string;
}

const SuggestAssignVehicles: React.FC<SuggestAssignVehiclesProps> = ({
  orderId,
  orderCode,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [createdContract, setCreatedContract] = useState<Contract | null>(null);
  const { loading, suggestData, fetchSuggestions } = useSuggestVehicles();

  const handleShowSuggestions = async () => {
    const result = await fetchSuggestions(orderId);
    if (result.success) {
      setIsModalVisible(true);
    } else {
      message.error(result.message || "Không thể tải dữ liệu gợi ý");
    }
  };

  const handleAcceptSuggestion = () => {
    setShowCreateContract(true);
  };

  const handleContractCreated = (contract: Contract) => {
    setCreatedContract(contract);
    message.success("Hợp đồng đã được tạo thành công!");
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCreatedContract(null);
  };

  const columns = [
    {
      title: "Số thứ tự xe",
      dataIndex: "vehicleIndex",
      key: "vehicleIndex",
      render: (index: number) => (
        <Tag color="blue" icon={<TruckOutlined />}>
          Xe #{index}
        </Tag>
      ),
    },
    {
      title: "Loại xe",
      dataIndex: "sizeRuleName",
      key: "sizeRuleName",
      render: (name: string) => <Text strong>{name.replace(/_/g, " ")}</Text>,
    },
    {
      title: "Tải trọng hiện tại",
      dataIndex: "currentLoad",
      key: "currentLoad",
      render: (load: number) => (
        <Space>
          <Text>{load} tấn</Text>
          <Tag color={load > 2 ? "orange" : "green"}>
            {load > 2 ? "Tải cao" : "Bình thường"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Số chi tiết đơn hàng",
      dataIndex: "assignedDetails",
      key: "assignedDetails",
      render: (details: string[]) => (
        <Tag color="purple">{details.length} chi tiết</Tag>
      ),
    },
    {
      title: "Chi tiết đơn hàng",
      dataIndex: "assignedDetails",
      key: "assignedDetailsExpanded",
      render: (details: string[]) => (
        <div>
          {details.map((detailId, index) => (
            <Tag key={detailId} color="default" style={{ marginBottom: 4 }}>
              {`Detail ${index + 1}: ${detailId.substring(0, 8)}...`}
            </Tag>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <Button
        type="primary"
        icon={loading ? <LoadingOutlined /> : <EyeOutlined />}
        onClick={handleShowSuggestions}
        loading={loading}
        size="small"
      >
        Xem gợi ý phân phối xe
      </Button>

      <Modal
        title={
          <Space>
            <TruckOutlined />
            <span>
              Gợi ý phân phối xe -{" "}
              {orderCode || `Đơn hàng ${orderId.substring(0, 8)}...`}
            </span>
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Đóng
          </Button>,
          ...(suggestData.length > 0 && !createdContract
            ? [
                <Button
                  key="accept"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleAcceptSuggestion}
                >
                  Chấp nhận & Tạo hợp đồng
                </Button>,
              ]
            : []),
        ]}
        width={1000}
        style={{ top: 20 }}
      >
        {suggestData.length > 0 ? (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space>
                <Text strong>Tổng số xe được gợi ý:</Text>
                <Tag color="blue">{suggestData.length} xe</Tag>
                <Text strong>Tổng tải trọng:</Text>
                <Tag color="green">
                  {suggestData
                    .reduce((sum, item) => sum + item.currentLoad, 0)
                    .toFixed(1)}{" "}
                  {suggestData.length > 0 ? suggestData[0].currentLoadUnit : ""}
                </Tag>
              </Space>
            </Card>

            <Table
              columns={columns}
              dataSource={suggestData}
              rowKey="sizeRuleId"
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
            />

            {createdContract && (
              <ContractInfo
                contract={createdContract}
                onPdfGenerated={(_pdfUrl) => {
                  message.success("PDF đã được tạo và sẵn sàng tải xuống!");
                }}
              />
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 40 }}>
            <TruckOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
            <Title level={4} style={{ color: "#999" }}>
              Không có gợi ý phân phối xe
            </Title>
            <Text type="secondary">Chưa có dữ liệu gợi ý cho đơn hàng này</Text>
          </div>
        )}
      </Modal>

      <CreateContractForm
        visible={showCreateContract}
        onCancel={() => setShowCreateContract(false)}
        orderId={orderId}
        orderCode={orderCode}
        onSuccess={handleContractCreated}
      />
    </>
  );
};

export default SuggestAssignVehicles;
