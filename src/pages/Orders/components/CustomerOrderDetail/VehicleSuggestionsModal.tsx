import React from "react";
import { Button, Modal, Card, Row, Col, Tag, Empty } from "antd";
import { TruckOutlined } from "@ant-design/icons";
import type { VehicleSuggestion } from "../../../../services/order/types";

interface VehicleSuggestionsModalProps {
    visible: boolean;
    orderCode?: string;
    vehicleSuggestions: VehicleSuggestion[];
    creatingContract: boolean;
    onCancel: () => void;
    onAccept: () => void;
}

const VehicleSuggestionsModal: React.FC<VehicleSuggestionsModalProps> = ({
    visible,
    orderCode,
    vehicleSuggestions,
    creatingContract,
    onCancel,
    onAccept,
}) => {
    return (
        <Modal
            title={
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <TruckOutlined className="mr-2 text-blue-500" />
                        <div>
                            <div className="font-semibold text-gray-800">
                                Đề xuất phân xe hàng
                            </div>
                            <div className="text-xs text-gray-500">{orderCode}</div>
                        </div>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    Đóng
                </Button>,
                <Button
                    key="accept"
                    type="primary"
                    loading={creatingContract}
                    onClick={onAccept}
                    disabled={vehicleSuggestions.length === 0}
                >
                    Tôi đồng ý với đề xuất xe hàng
                </Button>,
            ]}
            width={700}
        >
            <div className="space-y-4">
                {vehicleSuggestions.length > 0 ? (
                    <>
                        {/* Thông tin tổng quan */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600">
                                            <strong>Tổng số xe</strong>
                                        </div>
                                        <div className="text-lg font-bold text-orange-600">
                                            {vehicleSuggestions.length}
                                        </div>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600">
                                            <strong>Tổng kiện hàng</strong>
                                        </div>
                                        <div className="text-lg font-bold text-blue-600">
                                            {vehicleSuggestions.reduce(
                                                (total, suggestion) =>
                                                    total + suggestion.assignedDetails.length,
                                                0
                                            )}
                                        </div>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600">
                                            <strong>Tổng tải trọng</strong>
                                        </div>
                                        <div className="text-lg font-bold text-green-600">
                                            {vehicleSuggestions.reduce(
                                                (total, suggestion) => total + suggestion.currentLoad,
                                                0
                                            )}{" "}
                                            Tấn
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Danh sách xe */}
                        {vehicleSuggestions.map((suggestion, index) => (
                            <Card key={index} size="small" className="border">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-600">
                                                {suggestion.vehicleRuleName}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Row gutter={12} className="mb-3">
                                    <Col span={12}>
                                        <div className="text-center bg-gray-50 p-2 rounded">
                                            <div className="font-semibold text-green-600">
                                                {suggestion.currentLoad.toFixed(1)}t
                                            </div>
                                            <div className="text-xs text-gray-500">Tải trọng</div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="text-center bg-gray-50 p-2 rounded">
                                            <div className="font-semibold text-blue-600">
                                                {suggestion.assignedDetails.length}
                                            </div>
                                            <div className="text-xs text-gray-500">Kiện hàng</div>
                                        </div>
                                    </Col>
                                </Row>

                                <div>
                                    <div className="text-xs text-gray-500 mb-2">Kiện hàng:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {suggestion.assignedDetails.map((detail, idx) => (
                                            <Tag key={idx} color="blue" className="text-xs">
                                                {detail.id} - {detail.weight} {detail.unit}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </>
                ) : (
                    <Empty description="Không có đề xuất phân xe" />
                )}
            </div>
        </Modal>
    );
};

export default VehicleSuggestionsModal; 