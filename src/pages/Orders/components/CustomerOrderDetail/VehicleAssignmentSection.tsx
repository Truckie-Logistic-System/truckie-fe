import React, { useState } from "react";
import { Tabs, Empty, Card, Tag } from "antd";
import {
    BoxPlotOutlined,
    CarOutlined,
    FileTextOutlined,
    ToolOutlined,
    CameraOutlined,
    UserOutlined,
    PhoneOutlined,
    TagOutlined,
    EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import RouteMapSection from "./RouteMapSection";
import OrderDetailStatusCard from "../../../../components/common/OrderDetailStatusCard";
import { formatSealStatus, getSealStatusColor } from "../../../../models/JourneyHistory";
import "./VehicleAssignmentSection.css";

dayjs.extend(utc);
dayjs.extend(timezone);

interface VehicleAssignmentSectionProps {
    vehicleAssignments: any[];
    orderDetails: any[];
    formatDate: (date?: string) => string;
    getStatusColor: (status: string) => string;
}

/**
 * Component gộp thông tin chuyến xe + các tab chi tiết
 * - Thông tin chuyến xe luôn hiển thị ở trên
 * - Các tab phía dưới theo chuyến xe được chọn
 */
const VehicleAssignmentSection: React.FC<VehicleAssignmentSectionProps> = ({
    vehicleAssignments,
    orderDetails,
    formatDate,
    getStatusColor,
}) => {
    const [selectedVehicleAssignmentIndex, setSelectedVehicleAssignmentIndex] = useState(0);
    const [activeDetailTab, setActiveDetailTab] = useState("orderDetails");

    if (!vehicleAssignments || vehicleAssignments.length === 0) {
        return <Empty description="Chưa có thông tin phân công xe" />;
    }

    // Nhóm order details theo vehicle assignment
    interface VehicleAssignmentGroup {
        vehicleAssignment: any;
        orderDetails: any[];
    }

    const vehicleAssignmentMap = new Map<string, VehicleAssignmentGroup>();

    vehicleAssignments.forEach((va: any) => {
        vehicleAssignmentMap.set(va.id, {
            vehicleAssignment: va,
            orderDetails: [],
        });
    });

    orderDetails.forEach((detail: any) => {
        if (detail.vehicleAssignmentId) {
            const group = vehicleAssignmentMap.get(detail.vehicleAssignmentId);
            if (group) {
                group.orderDetails.push(detail);
            }
        }
    });

    const vehicleAssignmentGroups = Array.from(vehicleAssignmentMap.values());
    const currentGroup = vehicleAssignmentGroups[selectedVehicleAssignmentIndex];

    if (!currentGroup) {
        return <Empty description="Chưa có thông tin phân công xe" />;
    }

    const va = currentGroup.vehicleAssignment;

    return (
        <div className="vehicle-assignment-section border-2 border-blue-200 rounded-xl bg-blue-50 p-6 shadow-md">
            {/* Header - Tab chọn chuyến xe */}
            <div className="mb-4">
                <div className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
                    <CarOutlined className="mr-2" />
                    Chọn chuyến xe
                </div>
                <Tabs
                    activeKey={selectedVehicleAssignmentIndex.toString()}
                    onChange={(key) => {
                        setSelectedVehicleAssignmentIndex(parseInt(key));
                        setActiveDetailTab("orderDetails"); // Reset to first tab when switching vehicle
                    }}
                    type="card"
                    className="vehicle-tabs"
                    size="small"
                >
                    {vehicleAssignmentGroups.map((group, index) => (
                        <Tabs.TabPane
                            tab={
                                <span>
                                    <CarOutlined /> Chuyến xe #{index + 1} -{" "}
                                    {group.vehicleAssignment.trackingCode || "Chưa có mã"}
                                </span>
                            }
                            key={index.toString()}
                        >
                            {/* Phần này sẽ được render bên dưới */}
                        </Tabs.TabPane>
                    ))}
                </Tabs>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-blue-200 my-4"></div>

            {/* Thông tin chuyến xe - Luôn hiển thị */}
            <Card className="shadow-sm mb-4 rounded-lg border-blue-100" size="small">
                <div className="p-2">
                    {/* Thông tin phương tiện */}
                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                            <CarOutlined className="text-xl text-blue-500 mr-3" />
                            <span className="text-lg font-medium">
                                {va.vehicle?.licensePlateNumber ||
                                    va.licensePlateNumber ||
                                    "Chưa có thông tin"}
                            </span>
                            <Tag
                                className="ml-3"
                                color={getStatusColor(va.status || "")}
                            >
                                {va.status}
                            </Tag>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center">
                                <TagOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Nhà sản xuất:</span>
                                <span>
                                    {va.vehicle?.manufacturer ||
                                        va.manufacturer ||
                                        "Chưa có thông tin"}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <CarOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Mẫu xe:</span>
                                <span>
                                    {va.vehicle?.model ||
                                        va.model ||
                                        "Chưa có thông tin"}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <TagOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Loại xe:</span>
                                <span>
                                    {va.vehicle?.vehicleType ||
                                        va.vehicleType ||
                                        "Chưa có thông tin"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin tài xế */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <UserOutlined className="text-green-500 mr-2" />
                                <span className="font-medium">Tài xế chính</span>
                            </div>
                            {va.primaryDriver ? (
                                <div className="ml-6">
                                    <div className="flex items-center mb-1">
                                        <UserOutlined className="mr-2 text-gray-500" />
                                        <span>{va.primaryDriver.fullName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                        <span>{va.primaryDriver.phoneNumber}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <UserOutlined className="text-blue-500 mr-2" />
                                <span className="font-medium">Tài xế phụ</span>
                            </div>
                            {va.secondaryDriver ? (
                                <div className="ml-6">
                                    <div className="flex items-center mb-1">
                                        <UserOutlined className="mr-2 text-gray-500" />
                                        <span>{va.secondaryDriver.fullName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                        <span>{va.secondaryDriver.phoneNumber}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Divider */}
            <div className="border-t-2 border-blue-200 my-4"></div>

            {/* Các tab chi tiết của chuyến xe được chọn */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
                    <BoxPlotOutlined className="mr-2" />
                    Chi tiết chuyến xe
                </div>
                <Tabs activeKey={activeDetailTab} onChange={setActiveDetailTab} type="card">
                    {/* Tab danh sách kiện hàng */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <BoxPlotOutlined /> Danh sách kiện hàng
                            </span>
                        }
                        key="orderDetails"
                    >
                        {currentGroup.orderDetails.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {currentGroup.orderDetails.map((detail: any) => (
                                    <Card
                                        key={detail.id}
                                        className="shadow-md hover:shadow-lg transition-shadow rounded-xl border-l-4 border-l-green-500"
                                        size="small"
                                    >
                                        <div className="space-y-3">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="text-xs text-gray-500 font-medium">Mã theo dõi</div>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {detail.trackingCode || "Chưa có"}
                                                    </div>
                                                </div>
                                                <OrderDetailStatusCard status={detail.status} />
                                            </div>

                                            {/* Divider */}
                                            <div className="border-t border-gray-100"></div>

                                            {/* Details Grid */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Trọng lượng:</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {detail.weightBaseUnit} {detail.unit}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600">Mô tả:</span>
                                                    <span className="text-sm text-gray-900 text-right max-w-xs">
                                                        {detail.description || "Không có mô tả"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Empty description="Không có kiện hàng nào cho chuyến xe này" />
                        )}
                    </Tabs.TabPane>

                    {/* Tab lộ trình vận chuyển */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <EnvironmentOutlined /> Lộ trình vận chuyển
                            </span>
                        }
                        key="journey"
                    >
                        {va.journeyHistories && va.journeyHistories.length > 0 ? (
                            <div className="p-2">
                                {va.journeyHistories.map((journey: any, journeyIdx: number) => {
                                    if (!journey.journeySegments || journey.journeySegments.length === 0) {
                                        return null;
                                    }

                                    return (
                                        <div key={journey.id || `journey-${journeyIdx}`} className="mb-4">
                                            <RouteMapSection
                                                journeySegments={journey.journeySegments}
                                                journeyInfo={journey}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Empty description="Không có lịch sử hành trình nào" />
                        )}
                    </Tabs.TabPane>

                    {/* Tab sự cố */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <ToolOutlined /> Sự cố
                            </span>
                        }
                        key="issues"
                    >
                        {va.issues && va.issues.length > 0 ? (
                            <div className="p-2">
                                {va.issues.map((issueItem: any, issueIdx: number) => (
                                    <div key={issueIdx} className="bg-red-50 p-4 rounded-lg mb-3">
                                        <div className="flex items-center mb-3">
                                            <span className="font-medium">Mô tả sự cố:</span>
                                            <span className="ml-2">{issueItem.issue.description}</span>
                                            <Tag
                                                className="ml-2"
                                                color={getStatusColor(issueItem.issue.status)}
                                            >
                                                {issueItem.issue.status}
                                            </Tag>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {issueItem.issue.issueTypeName && (
                                                <div className="flex items-center">
                                                    <span className="font-medium mr-1">Loại sự cố:</span>
                                                    <span>{issueItem.issue.issueTypeName}</span>
                                                </div>
                                            )}
                                            {issueItem.issue.staff && (
                                                <>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">Nhân viên xử lý:</span>
                                                        <span>{issueItem.issue.staff.name}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">Liên hệ:</span>
                                                        <span>{issueItem.issue.staff.phone}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {issueItem.imageUrls && issueItem.imageUrls.length > 0 ? (
                                            <div className="mt-4">
                                                <div className="flex items-center mb-2">
                                                    <span className="font-medium">Hình ảnh:</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {issueItem.imageUrls.map((url: string, idx: number) => (
                                                        <img
                                                            key={idx}
                                                            src={url}
                                                            alt={`Issue image ${idx + 1}`}
                                                            width={100}
                                                            height={100}
                                                            className="object-cover rounded"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 text-gray-500">
                                                <span>Chưa có hình ảnh</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description="Không có sự cố nào được ghi nhận" />
                        )}
                    </Tabs.TabPane>

                    {/* Tab niêm phong */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <FileTextOutlined /> Niêm phong
                            </span>
                        }
                        key="seals"
                    >
                        {va.seals && va.seals.length > 0 ? (
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {va.seals.map((seal: any) => (
                                        <div key={seal.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-600">Mã niêm phong</p>
                                                    <p className="text-base font-bold text-blue-600">{seal.sealCode || seal.sealId}</p>
                                                </div>
                                                <Tag color={getSealStatusColor(seal.status)} className="ml-2">
                                                    {formatSealStatus(seal.status)}
                                                </Tag>
                                            </div>

                                            <div className="space-y-2 mb-3 pb-3 border-b border-blue-200">
                                                <div>
                                                    <p className="text-xs text-gray-500">Mô tả</p>
                                                    <p className="text-sm text-gray-700">{seal.description || "Không có mô tả"}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <p className="text-gray-500">Ngày niêm phong</p>
                                                    <p className="font-medium text-gray-700">{seal.sealDate ? formatDate(seal.sealDate) : "Chưa có"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Thời gian gỡ</p>
                                                    <p className="font-medium text-gray-700">{seal.sealRemovalTime ? formatDate(seal.sealRemovalTime) : "Chưa gỡ"}</p>
                                                </div>
                                            </div>

                                            {seal.sealAttachedImage && (
                                                <div className="mt-3 pt-3 border-t border-blue-200">
                                                    <p className="text-xs text-gray-500 mb-2">Hình ảnh niêm phong</p>
                                                    <img
                                                        src={seal.sealAttachedImage}
                                                        alt={`Seal ${seal.sealCode}`}
                                                        className="w-full h-24 object-cover rounded"
                                                    />
                                                </div>
                                            )}

                                            {seal.sealRemovalReason && (
                                                <div className="mt-3 pt-3 border-t border-blue-200">
                                                    <p className="text-xs text-gray-500">Lý do gỡ niêm phong</p>
                                                    <p className="text-sm text-red-600 font-medium">{seal.sealRemovalReason}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Empty description="Không có thông tin niêm phong" />
                        )}
                    </Tabs.TabPane>

                    {/* Tab hình ảnh hoàn thành */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <CameraOutlined /> Hình ảnh hoàn thành
                            </span>
                        }
                        key="photos"
                    >
                        {va.photoCompletions && va.photoCompletions.length > 0 ? (
                            <div className="p-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {va.photoCompletions.map((url: string, idx: number) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Completion photo ${idx + 1}`}
                                                className="object-cover rounded w-full h-32"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Empty description="Không có hình ảnh hoàn thành" />
                        )}
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </div>
    );
};

export default VehicleAssignmentSection;