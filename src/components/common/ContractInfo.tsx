import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Divider,
  message,
  Alert,
} from "antd";
import {
  FileTextOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  LoadingOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { contractService } from "../../services/contract";
import type { Contract } from "../../services/contract/types";

const { Text, Link } = Typography;

interface ContractInfoProps {
  contract: Contract;
  onPdfGenerated?: (pdfUrl: string) => void;
}

const ContractInfo: React.FC<ContractInfoProps> = ({
  contract,
  onPdfGenerated,
}) => {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleGeneratePdf = async () => {
    setLoadingPdf(true);
    try {
      const response = await contractService.generateContractPdf(contract.id);

      if (response.success) {
        setPdfUrl(response.data.pdfUrl);
        message.success("Tạo file PDF thành công!");
        onPdfGenerated?.(response.data.pdfUrl);
      } else {
        message.error(response.message || "Không thể tạo file PDF");
      }
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra khi tạo PDF");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONTRACT_DRAFT":
        return "orange";
      case "CONTRACT_ACTIVE":
        return "green";
      case "CONTRACT_COMPLETED":
        return "blue";
      case "CONTRACT_CANCELLED":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONTRACT_DRAFT":
        return "Bản nháp";
      case "CONTRACT_ACTIVE":
        return "Đang hiệu lực";
      case "CONTRACT_COMPLETED":
        return "Hoàn thành";
      case "CONTRACT_CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Thông tin hợp đồng</span>
          <Tag color={getStatusColor(contract.status)}>
            {getStatusText(contract.status)}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          {!pdfUrl && (
            <Button
              type="primary"
              icon={loadingPdf ? <LoadingOutlined /> : <FilePdfOutlined />}
              onClick={handleGeneratePdf}
              loading={loadingPdf}
              size="small"
            >
              {loadingPdf ? "Đang tạo PDF..." : "Tạo PDF"}
            </Button>
          )}
          {pdfUrl && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadPdf}
              size="small"
            >
              Tải PDF
            </Button>
          )}
        </Space>
      }
      size="small"
      className="mt-4"
    >
      <div className="space-y-3">
        <div>
          <Text strong className="block mb-1">
            Tên hợp đồng:
          </Text>
          <Text>{contract.contractName}</Text>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text strong className="block mb-1">
              <CalendarOutlined /> Ngày hiệu lực:
            </Text>
            <Text>{formatDate(contract.effectiveDate)}</Text>
          </div>
          <div>
            <Text strong className="block mb-1">
              <CalendarOutlined /> Ngày hết hạn:
            </Text>
            <Text>{formatDate(contract.expirationDate)}</Text>
          </div>
        </div>

        <div>
          <Text strong className="block mb-1">
            Tổng giá trị:
          </Text>
          <Text className="text-lg font-semibold text-green-600">
            {contract.totalValue === "0"
              ? "Chưa xác định"
              : `${contract.totalValue} VNĐ`}
          </Text>
        </div>

        {contract.description && (
          <div>
            <Text strong className="block mb-1">
              Mô tả:
            </Text>
            <Text type="secondary">{contract.description}</Text>
          </div>
        )}

        {contract.attachFileUrl && (
          <div>
            <Text strong className="block mb-1">
              File đính kèm:
            </Text>
            <Link href={contract.attachFileUrl} target="_blank">
              <FileTextOutlined /> Xem file đính kèm
            </Link>
          </div>
        )}

        <Divider style={{ margin: "12px 0" }} />

        <div className="text-xs text-gray-500">
          <Space split={<span>•</span>}>
            <span>ID: {contract.id.substring(0, 8)}...</span>
            <span>Order ID: {contract.orderId.substring(0, 8)}...</span>
          </Space>
        </div>

        {pdfUrl && (
          <Alert
            message="PDF đã được tạo thành công!"
            description={
              <Space direction="vertical" size="small">
                <Text>File PDF hợp đồng đã sẵn sàng để tải xuống.</Text>
                <Link href={pdfUrl} target="_blank">
                  <FilePdfOutlined /> {pdfUrl}
                </Link>
              </Space>
            }
            type="success"
            icon={<InfoCircleOutlined />}
            showIcon
            className="mt-3"
          />
        )}
      </div>
    </Card>
  );
};

export default ContractInfo;
