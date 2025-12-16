import React, { useMemo, useState } from "react";
import { Card, Button, Tag, Divider, Empty, Skeleton, Tooltip, Pagination } from "antd";
import { CarOutlined, CheckCircleOutlined, ThunderboltOutlined } from "@ant-design/icons";
import type { OrderDetailGroup, VehicleSuggestion } from "../../../../../models/VehicleAssignment";

interface TripSelectionStepProps {
    detailGroups: OrderDetailGroup[];
    suggestionsMap: Record<number, VehicleSuggestion[]>;
    loading: boolean;
    onSelectTrips: (indices: number[]) => void;
    onAcceptAllSuggestions?: () => void;
}

const PACKAGES_PER_PAGE = 3;

export const TripSelectionStep: React.FC<TripSelectionStepProps> = ({
    detailGroups,
    suggestionsMap,
    loading,
    onSelectTrips,
    onAcceptAllSuggestions
}) => {
    // State for pagination of each trip's packages
    const [packagePages, setPackagePages] = useState<Record<number, number>>({});
    // Check if all trips have complete suggestions (vehicle + 2 drivers)
    const allTripsHaveCompleteSuggestions = useMemo(() => {
        if (detailGroups.length === 0) return false;
        
        return detailGroups.every((_, index) => {
            const suggestions = suggestionsMap[index] || [];
            const recommendedVehicle = suggestions.find(v => v.isRecommended);
            if (!recommendedVehicle) return false;
            
            const recommendedDrivers = recommendedVehicle.suggestedDrivers
                .filter(d => d.isRecommended);
            return recommendedDrivers.length >= 2;
        });
    }, [detailGroups, suggestionsMap]);

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[1, 2].map((i) => (
                    <Skeleton key={i} active paragraph={{ rows: 4 }} />
                ))}
            </div>
        );
    }

    if (detailGroups.length === 0) {
        return <Empty description="Không có chuyến nào để phân công" />;
    }

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Danh sách chuyến cần phân công
                </h3>
                <p className="text-sm text-gray-600">
                    Tất cả {detailGroups.length} chuyến sẽ được phân công xe và tài xế
                </p>
            </div>

            {/* Trip Cards */}
            <div className="space-y-3">
                {detailGroups.map((group, index) => {
                    const suggestions = suggestionsMap[index] || [];
                    const recommendedVehicle = suggestions.find(v => v.isRecommended);
                    const recommendedDrivers = recommendedVehicle?.suggestedDrivers
                        .filter(d => d.isRecommended)
                        .slice(0, 2) || [];

                    return (
                        <Card
                            key={index}
                            size="small"
                            className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-white"
                            hoverable
                        >
                            <div className="space-y-3">
                                {/* Trip Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800">
                                                Chuyến #{index + 1}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {group.orderDetails.length} kiện hàng
                                            </div>
                                        </div>
                                    </div>
                                    <Tag color="blue" className="font-medium">
                                        {group.orderDetails.length} kiện
                                    </Tag>
                                </div>

                                <Divider className="my-2" />

                                {/* Recommended Vehicle */}
                                {recommendedVehicle ? (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircleOutlined className="text-green-600" />
                                            <span className="text-sm font-medium text-green-700">Xe được đề xuất</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-white p-2 rounded">
                                                <span className="text-gray-600">Biển số:</span>
                                                <div className="font-semibold text-gray-800">{recommendedVehicle.licensePlateNumber}</div>
                                            </div>
                                            <div className="bg-white p-2 rounded">
                                                <span className="text-gray-600">Model:</span>
                                                <div className="font-semibold text-gray-800">{recommendedVehicle.model}</div>
                                            </div>
                                            <div className="bg-white p-2 rounded">
                                                <span className="text-gray-600">Hãng:</span>
                                                <div className="font-semibold text-gray-800">{recommendedVehicle.manufacturer}</div>
                                            </div>
                                            <div className="bg-white p-2 rounded">
                                                <span className="text-gray-600">Loại:</span>
                                                <div className="font-semibold text-gray-800">{recommendedVehicle.vehicleTypeDescription ?? recommendedVehicle.vehicleTypeName}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-600">
                                        Không có xe được đề xuất
                                    </div>
                                )}

                                {/* Recommended Drivers */}
                                {recommendedDrivers.length > 0 && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircleOutlined className="text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700">Tài xế được đề xuất</span>
                                        </div>
                                        <div className="space-y-2">
                                            {recommendedDrivers.map((driver, idx) => (
                                                <div key={driver.id} className="bg-white p-2 rounded border border-blue-100">
                                                    <div className="flex items-start justify-between mb-1">
                                                        <span className="font-semibold text-blue-600 text-sm">
                                                            Tài xế {idx + 1}: {driver.fullName}
                                                        </span>
                                                        <Tag color="blue" className="text-xs">Đề xuất</Tag>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                                                        <div>GPLX: <span className="font-medium text-gray-800">{driver.driverLicenseNumber}</span></div>
                                                        <div>Hạng: <span className="font-medium text-gray-800">{driver.licenseClass}</span></div>
                                                        <div>Kinh nghiệm: <span className="font-medium text-gray-800">{driver.experienceYears} năm</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Order Details Preview with Pagination */}
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="text-xs font-medium text-gray-700 mb-2">Kiện hàng:</div>
                                    {(() => {
                                        const currentPage = packagePages[index] || 1;
                                        const startIndex = (currentPage - 1) * PACKAGES_PER_PAGE;
                                        const endIndex = startIndex + PACKAGES_PER_PAGE;
                                        const paginatedDetails = group.orderDetails.slice(startIndex, endIndex);
                                        const totalPackages = group.orderDetails.length;

                                        return (
                                            <>
                                                <div className="space-y-1">
                                                    {paginatedDetails.map((detail, idx) => (
                                                        <div key={detail.id} className="text-xs text-gray-600 flex justify-between items-center">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-blue-600">
                                                                    {startIndex + idx + 1}. {detail.trackingCode}
                                                                </span>
                                                                <span className="text-gray-500">{detail.description}</span>
                                                            </div>
                                                            <span className="text-gray-500">{detail.weightBaseUnit} {detail.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {totalPackages > PACKAGES_PER_PAGE && (
                                                    <div className="flex justify-center mt-3">
                                                        <Pagination
                                                            current={currentPage}
                                                            pageSize={PACKAGES_PER_PAGE}
                                                            total={totalPackages}
                                                            onChange={(page) => {
                                                                setPackagePages(prev => ({
                                                                    ...prev,
                                                                    [index]: page
                                                                }));
                                                            }}
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
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                {allTripsHaveCompleteSuggestions && onAcceptAllSuggestions && (
                    <Tooltip title="Chấp nhận tất cả đề xuất xe và tài xế, bỏ qua bước chọn thủ công">
                        <Button
                            type="primary"
                            size="large"
                            onClick={onAcceptAllSuggestions}
                            className="bg-green-600 hover:bg-green-700 px-6 font-semibold"
                            icon={<ThunderboltOutlined />}
                        >
                            Đồng ý với đề xuất
                        </Button>
                    </Tooltip>
                )}
                <Button
                    type="primary"
                    size="large"
                    onClick={() => onSelectTrips(Array.from({ length: detailGroups.length }, (_, i) => i))}
                    className="bg-blue-600 hover:bg-blue-700 px-8 font-semibold"
                    icon={<CarOutlined />}
                >
                    {allTripsHaveCompleteSuggestions ? "Tùy chỉnh phân công" : `Xác nhận phân công ${detailGroups.length} chuyến`}
                </Button>
            </div>
        </div>
    );
};
