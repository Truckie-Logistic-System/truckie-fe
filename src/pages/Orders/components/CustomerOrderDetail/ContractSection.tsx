import React from "react";
import { Card, Descriptions, Empty, Button, Tag } from "antd";
import { FileTextOutlined } from "@ant-design/icons";

interface ContractProps {
    contract?: {
        id: string;
        contractName: string;
        effectiveDate: string;
        expirationDate: string;
        totalValue: string;
        supportedValue: string;
        description: string;
        attachFileUrl: string;
        status: string;
        staffName: string;
    };
}

const ContractSection: React.FC<ContractProps> = ({ contract }) => {
    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            PENDING: "orange",
            PROCESSING: "blue",
            CANCELLED: "red",
            APPROVED: "green",
            ACTIVE: "green",
            EXPIRED: "red",
            // Add more status mappings as needed
        };
        return statusMap[status] || "default";
    };

    return (
        <Card
            title={
                <div className="flex items-center">
                    <FileTextOutlined className="mr-2 text-blue-500" />
                    <span>Thông tin hợp đồng</span>
                </div>
            }
            className="shadow-md mb-6 rounded-xl"
        >
            {contract ? (
                <>
                    <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
                        <Descriptions.Item label="Tên hợp đồng">{contract.contractName || "Chưa có thông tin"}</Descriptions.Item>
                        <Descriptions.Item label="Ngày hiệu lực">{contract.effectiveDate || "Chưa có thông tin"}</Descriptions.Item>
                        <Descriptions.Item label="Ngày hết hạn">{contract.expirationDate || "Chưa có thông tin"}</Descriptions.Item>
                        <Descriptions.Item label="Giá trị hợp đồng">{contract.totalValue || "Chưa có thông tin"}</Descriptions.Item>
                        <Descriptions.Item label="Giá trị hỗ trợ">{contract.supportedValue || "Chưa có thông tin"}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {contract.status ? (
                                <Tag color={getStatusColor(contract.status)}>{contract.status}</Tag>
                            ) : (
                                "Chưa có thông tin"
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Nhân viên phụ trách">{contract.staffName || "Chưa có thông tin"}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả" span={3}>{contract.description || "Không có mô tả"}</Descriptions.Item>
                    </Descriptions>

                    {contract.attachFileUrl ? (
                        <div className="mt-4">
                            <Button type="primary" href={contract.attachFileUrl} target="_blank">
                                Xem file đính kèm
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <p className="text-gray-500">Chưa có file đính kèm</p>
                        </div>
                    )}
                </>
            ) : (
                <Empty description="Chưa có thông tin hợp đồng" />
            )}
        </Card>
    );
};

export default ContractSection; 