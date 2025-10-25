import React from "react";
import { Button, Modal, Card, Row, Col, Empty } from "antd";
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
                      {vehicleSuggestions.length > 0 ? vehicleSuggestions[0].currentLoadUnit : ""}
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
                      <div className="text-xs text-gray-500">
                        Tổng tải trọng cho xe
                      </div>
                      <div className="font-semibold text-green-600">
                        {suggestion.currentLoad}{suggestion.currentLoadUnit}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="text-center bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Kiện hàng</div>
                      <div className="font-semibold text-blue-600">
                        {suggestion.assignedDetails.length}
                      </div>
                    </div>
                  </Col>
                </Row>

                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      📦 Danh sách kiện hàng
                    </span>
                  </div>
                  <div className="space-y-2">
                    {suggestion.assignedDetails.map((detail, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono text-gray-600 bg-white px-2 py-1 rounded border">
                                <strong>{detail.trackingCode}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  Khối lượng:
                                </span>
                                <span className="font-bold text-blue-700">
                                  {detail.weightBaseUnit}
                                </span>
                                <span className="text-xs text-gray-600 bg-blue-100 px-2 py-0.5 rounded">
                                  {detail.unit}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
