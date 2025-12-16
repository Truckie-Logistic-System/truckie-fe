import React, { useState } from "react";
import { Button, Modal, Card, Row, Col, Empty, Tabs, Alert, Pagination } from "antd";
import {
  TruckOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { VehicleSuggestion } from "../../../../services/order/types";
import Package3DVisualization from "../../../../components/common/Package3DVisualization";

interface VehicleSuggestionsModalProps {
  visible: boolean;
  orderCode?: string;
  vehicleSuggestions: {
    optimal: VehicleSuggestion[];
    realistic: VehicleSuggestion[];
  };
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
  const [activeTab, setActiveTab] = useState("realistic");
  const [visualizationVisible, setVisualizationVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleSuggestion | null>(null);
  // Pagination state for each vehicle's package list
  const [packagePages, setPackagePages] = useState<Record<string, number>>({});
  const PACKAGES_PER_PAGE = 3;

  const getPackagePage = (vehicleKey: string) => packagePages[vehicleKey] || 1;

  const setPackagePage = (vehicleKey: string, page: number) => {
    setPackagePages((prev) => ({ ...prev, [vehicleKey]: page }));
  };

  const handleVisualize = (vehicle: VehicleSuggestion) => {
    // Map tracking codes to packed details for 3D visualization
    if (vehicle.packedDetailDetails && vehicle.assignedDetails) {
      const packagesWithTrackingCode = vehicle.packedDetailDetails.map(
        (pkg) => {
          const detail = vehicle.assignedDetails.find(
            (d) => d.id === pkg.orderDetailId
          );
          return {
            ...pkg,
            trackingCode: detail?.trackingCode,
          };
        }
      );

      setSelectedVehicle({
        ...vehicle,
        packedDetailDetails: packagesWithTrackingCode,
      });
    } else {
      setSelectedVehicle(vehicle);
    }
    setVisualizationVisible(true);
  };

  const renderVehicleList = (
    suggestions: VehicleSuggestion[],
    isOptimal: boolean = false
  ) => {
    if (suggestions.length === 0) {
      return <Empty description="Không có đề xuất phân xe" />;
    }

    return (
      <>
        {/* Thông tin tổng quan */}
        <div
          className={`p-3 rounded-lg border ${
            isOptimal
              ? "bg-blue-50 border-blue-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <Row gutter={16}>
            <Col span={8}>
              <div className="text-center">
                <div className="text-xs text-gray-600">
                  <strong>Tổng số xe</strong>
                </div>
                <div
                  className={`text-lg font-bold ${
                    isOptimal ? "text-blue-600" : "text-green-600"
                  }`}
                >
                  {suggestions.length}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center">
                <div className="text-xs text-gray-600">
                  <strong>Tổng kiện hàng</strong>
                </div>
                <div
                  className={`text-lg font-bold ${
                    isOptimal ? "text-blue-600" : "text-green-600"
                  }`}
                >
                  {suggestions.reduce(
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
                <div
                  className={`text-lg font-bold ${
                    isOptimal ? "text-blue-600" : "text-green-600"
                  }`}
                >
                  {suggestions.reduce(
                    (total, suggestion) => total + suggestion.currentLoad,
                    0
                  )}{" "}
                  {suggestions.length > 0 ? suggestions[0].currentLoadUnit : ""}
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Danh sách xe */}
        {suggestions.map((suggestion, index) => (
          <Card key={index} size="small" className="border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                    isOptimal ? "bg-blue-500" : "bg-green-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <div
                    className={`font-medium ${
                      isOptimal ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    {suggestion.sizeRuleName}
                  </div>
                </div>
              </div>
            </div>

            <Row gutter={12} className="mb-3">
              <Col span={8}>
                <div className="text-center bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">
                    Tổng tải trọng cho xe
                  </div>
                  <div
                    className={`font-semibold ${
                      isOptimal ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    {suggestion.currentLoad} {suggestion.currentLoadUnit}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Kiện hàng</div>
                  <div
                    className={`font-semibold ${
                      isOptimal ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    {suggestion.assignedDetails.length}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleVisualize(suggestion)}
                    block
                    className={isOptimal ? "bg-blue-500" : "bg-green-500"}
                  >
                    Trực quan 3D
                  </Button>
                </div>
              </Col>
            </Row>

            <div>
              <div className="text-xs font-semibold text-gray-700 mb-3 flex items-center">
                <span
                  className={`px-2 py-1 rounded ${
                    isOptimal
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  📦 Danh sách kiện hàng
                </span>
              </div>
              {(() => {
                const vehicleKey = `${isOptimal ? "optimal" : "realistic"}-${index}`;
                const currentPage = getPackagePage(vehicleKey);
                const totalItems = suggestion.assignedDetails.length;
                const startIndex = (currentPage - 1) * PACKAGES_PER_PAGE;
                const endIndex = startIndex + PACKAGES_PER_PAGE;
                const paginatedDetails = suggestion.assignedDetails.slice(startIndex, endIndex);

                return (
                  <>
                    <div className="space-y-2">
                      {paginatedDetails.map((detail, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border hover:shadow-md transition-shadow ${
                            isOptimal
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                              : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                          }`}
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
                                  <span
                                    className={`font-bold ${
                                      isOptimal ? "text-blue-700" : "text-green-700"
                                    }`}
                                  >
                                    {detail.weightBaseUnit}
                                  </span>
                                  <span
                                    className={`text-xs text-gray-600 px-2 py-0.5 rounded ${
                                      isOptimal ? "bg-blue-100" : "bg-green-100"
                                    }`}
                                  >
                                    {detail.unit}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalItems > PACKAGES_PER_PAGE && (
                      <div className="flex justify-center mt-3">
                        <Pagination
                          current={currentPage}
                          pageSize={PACKAGES_PER_PAGE}
                          total={totalItems}
                          onChange={(page) => setPackagePage(vehicleKey, page)}
                          size="small"
                          showSizeChanger={false}
                          showTotal={(total, range) =>
                            `${range[0]}-${range[1]} / ${total} kiện`
                          }
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </Card>
        ))}
      </>
    );
  };
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
          disabled={vehicleSuggestions.realistic.length === 0}
        >
          Tôi đồng ý với đề xuất xe hàng
        </Button>,
      ]}
      width={800}
    >
      <div className="space-y-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "realistic",
              label: (
                <span className="flex items-center gap-2">
                  <CheckCircleOutlined />
                  <span>Phương án thực tế (Bắt buộc)</span>
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <Alert
                    message="Phương án bắt buộc"
                    description="Phương án này dựa trên tình trạng sẵn có của xe và lịch trình thực tế. Đây là phương án bạn cần đặt để đảm bảo giao hàng đúng thời gian."
                    type="success"
                    showIcon
                    className="mb-4"
                  />
                  {renderVehicleList(vehicleSuggestions.realistic, false)}
                </div>
              ),
            },
            {
              key: "optimal",
              label: (
                <span className="flex items-center gap-2">
                  <ThunderboltOutlined />
                  <span>Phương án tối ưu (Đề xuất)</span>
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <Alert
                    message="Phương án đề xuất"
                    description="Phương án này tối ưu chi phí và hiệu suất vận chuyển. Tuy nhiên, phương án này chỉ mang tính tham khảo và có thể không khả thi do lịch trình xe."
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                  {renderVehicleList(vehicleSuggestions.optimal, true)}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 3D Visualization Modal */}
      {selectedVehicle && selectedVehicle.packedDetailDetails && (
        <Package3DVisualization
          visible={visualizationVisible}
          onClose={() => {
            setVisualizationVisible(false);
            setSelectedVehicle(null);
          }}
          packages={selectedVehicle.packedDetailDetails}
          vehicleName={selectedVehicle.sizeRuleName || "Xe tải"}
          containerDimensions={
            selectedVehicle.maxLength &&
            selectedVehicle.maxWidth &&
            selectedVehicle.maxHeight
              ? {
                  length: selectedVehicle.maxLength,
                  width: selectedVehicle.maxWidth,
                  height: selectedVehicle.maxHeight,
                }
              : undefined
          }
        />
      )}
    </Modal>
  );
};

export default VehicleSuggestionsModal;
