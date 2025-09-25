import React from "react";
import { Card, Descriptions, Tag, Tabs, Timeline, Image, Empty } from "antd";
import {
    CarOutlined,
    ToolOutlined,
    HistoryOutlined,
    FileTextOutlined,
    CameraOutlined,
    UserOutlined,
    PhoneOutlined,
    NumberOutlined,
    TagOutlined,
    DashboardOutlined,
    FireOutlined,
    EnvironmentOutlined,
    DollarOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TabPane } = Tabs;

interface VehicleInfoSectionProps {
    vehicleAssignment?: {
        id: string;
        trackingCode?: string; // Add trackingCode property
        vehicle?: {
            id: string;
            manufacturer: string;
            model: string;
            licensePlateNumber: string;
            vehicleType: string;
        };
        primaryDriver?: {
            id: string;
            fullName: string;
            phoneNumber: string;
        };
        secondaryDriver?: {
            id: string;
            fullName: string;
            phoneNumber: string;
        };
        status: string;
        issues?: {
            issue: {
                id: string;
                description: string;
                locationLatitude: number;
                locationLongitude: number;
                status: string;
                vehicleAssignmentId: string;
                staff: {
                    id: string;
                    name: string;
                    phone: string;
                };
                issueTypeName: string;
            };
            imageUrls: string[];
        }[];
        photoCompletions?: string[]; // Thêm thuộc tính photoCompletions
        orderSeals?: {
            id: string;
            description: string;
            sealDate: string;
            status: string;
            sealId: string;
        }[];
        journeyHistories?: {
            id: string;
            startLocation: number;
            endLocation: number;
            startTime: string;
            endTime: string;
            status: string;
            totalDistance: number;
            isReportedIncident: boolean;
            createdAt: string;
            modifiedAt: string;
        }[];
        penalties?: {
            id: string;
            violationType: string;
            violationDescription: string;
            penaltyAmount: number;
            penaltyDate: string;
            location: string;
            status: string;
            paymentDate: string;
            disputeReason: string;
            driverId: string;
            vehicleAssignmentId: string;
        }[];
        cameraTrackings?: {
            id: string;
            videoUrl: string;
            trackingAt: string;
            status: string;
            vehicleAssignmentId: string;
            deviceName: string;
        }[];
        fuelConsumption?: {
            id: string;
            odometerReadingAtRefuel: number;
            odometerAtStartUrl: string;
            odometerAtFinishUrl: string;
            odometerAtEndUrl: string;
            dateRecorded: string;
            notes: string;
            fuelTypeName: string;
            fuelTypeDescription: string;
        };
    };
}

const VehicleInfoSection: React.FC<VehicleInfoSectionProps> = ({ vehicleAssignment }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Chưa có thông tin";
        return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
    };

    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return "0 VND";
        return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    };

    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            PENDING: "orange",
            PROCESSING: "blue",
            CANCELLED: "red",
            DELIVERED: "green",
            SUCCESSFUL: "green",
            IN_TROUBLES: "red",
            ACTIVE: "green",
            INACTIVE: "red",
            PAID: "green",
            UNPAID: "red",
            // Add more status mappings as needed
        };
        return statusMap[status] || "default";
    };

    if (!vehicleAssignment) {
        return (
            <Card
                title={
                    <div className="flex items-center">
                        <CarOutlined className="mr-2 text-blue-500" />
                        <span>Thông tin phương tiện vận chuyển</span>
                    </div>
                }
                className="shadow-md mb-6 rounded-xl"
                size="small"
            >
                <Empty description="Chưa có thông tin phương tiện vận chuyển" />
            </Card>
        );
    }

    // Check if vehicle information is available
    const hasVehicleInfo = vehicleAssignment.vehicle !== null && vehicleAssignment.vehicle !== undefined;

    const tabItems = [
        {
            key: "vehicle",
            label: (
                <span>
                    <CarOutlined /> Thông tin phương tiện
                </span>
            ),
            children: (
                <div className="p-2">
                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                        {hasVehicleInfo ? (
                            <>
                                <div className="flex items-center mb-3">
                                    <CarOutlined className="text-xl text-blue-500 mr-3" />
                                    <span className="text-lg font-medium">{vehicleAssignment.vehicle?.licensePlateNumber || "Chưa có thông tin"}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center">
                                        <TagOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Nhà sản xuất:</span>
                                        <span>{vehicleAssignment.vehicle?.manufacturer || "Chưa có thông tin"}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CarOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Mẫu xe:</span>
                                        <span>{vehicleAssignment.vehicle?.model || "Chưa có thông tin"}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <TagOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Loại xe:</span>
                                        <span>{vehicleAssignment.vehicle?.vehicleType || "Chưa có thông tin"}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-2">
                                <p className="text-gray-500">Chưa có thông tin phương tiện</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <UserOutlined className="text-green-500 mr-2" />
                                <span className="font-medium">Tài xế chính</span>
                            </div>
                            {vehicleAssignment.primaryDriver ? (
                                <div className="ml-6">
                                    <div className="flex items-center mb-1">
                                        <UserOutlined className="mr-2 text-gray-500" />
                                        <span>{vehicleAssignment.primaryDriver.fullName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                        <span>{vehicleAssignment.primaryDriver.phoneNumber}</span>
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
                            {vehicleAssignment.secondaryDriver ? (
                                <div className="ml-6">
                                    <div className="flex items-center mb-1">
                                        <UserOutlined className="mr-2 text-gray-500" />
                                        <span>{vehicleAssignment.secondaryDriver.fullName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                        <span>{vehicleAssignment.secondaryDriver.phoneNumber}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        ...(vehicleAssignment.issues && vehicleAssignment.issues.length > 0
            ? [
                {
                    key: "issues",
                    label: (
                        <span>
                            <ToolOutlined /> Sự cố
                        </span>
                    ),
                    children: (
                        <div className="p-2">
                            {vehicleAssignment.issues.map((issueItem, index) => (
                                <div key={issueItem.issue.id} className={index > 0 ? "mt-6 pt-6 border-t" : ""}>
                                    <div className="bg-red-50 p-4 rounded-lg mb-3">
                                        <div className="flex items-center mb-3">
                                            <ToolOutlined className="text-red-500 mr-2" />
                                            <span className="font-medium">Mô tả sự cố:</span>
                                            <span className="ml-2">{issueItem.issue.description}</span>
                                            <Tag className="ml-2" color={getStatusColor(issueItem.issue.status)}>
                                                {issueItem.issue.status}
                                            </Tag>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="flex items-center">
                                                <TagOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Loại sự cố:</span>
                                                <span>{issueItem.issue.issueTypeName}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <UserOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Nhân viên xử lý:</span>
                                                <span>{issueItem.issue.staff.name}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <PhoneOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Liên hệ:</span>
                                                <span>{issueItem.issue.staff.phone}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <EnvironmentOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Vị trí:</span>
                                                <span>{issueItem.issue.locationLatitude}, {issueItem.issue.locationLongitude}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {issueItem.imageUrls && issueItem.imageUrls.length > 0 ? (
                                        <div className="mt-4">
                                            <div className="flex items-center mb-2">
                                                <CameraOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium">Hình ảnh:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {issueItem.imageUrls.map((url, idx) => (
                                                    <Image
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
                                            <CameraOutlined className="mr-2" />
                                            <span>Chưa có hình ảnh</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ),
                },
            ]
            : []),
        ...(vehicleAssignment.journeyHistories && vehicleAssignment.journeyHistories.length > 0
            ? [
                {
                    key: "journey",
                    label: (
                        <span>
                            <HistoryOutlined /> Lịch sử hành trình
                        </span>
                    ),
                    children: (
                        <div className="p-2">
                            <Timeline
                                mode="left"
                                items={vehicleAssignment.journeyHistories.map((journey) => ({
                                    label: formatDate(journey.startTime),
                                    children: (
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <div className="flex items-center mb-2">
                                                <TagOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium mr-1">Trạng thái:</span>
                                                <Tag color={getStatusColor(journey.status)}>{journey.status}</Tag>
                                            </div>
                                            <div className="flex items-center mb-2">
                                                <CalendarOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Thời gian kết thúc:</span>
                                                <span>{formatDate(journey.endTime)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <DashboardOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Tổng quãng đường:</span>
                                                <span>{journey.totalDistance} km</span>
                                            </div>
                                            {journey.isReportedIncident && (
                                                <div className="mt-2">
                                                    <Tag color="red" icon={<ToolOutlined />}>Có báo cáo sự cố</Tag>
                                                </div>
                                            )}
                                        </div>
                                    ),
                                }))}
                            />
                        </div>
                    ),
                },
            ]
            : []),
        ...(vehicleAssignment.penalties && vehicleAssignment.penalties.length > 0
            ? [
                {
                    key: "penalties",
                    label: (
                        <span>
                            <ToolOutlined /> Vi phạm & Phạt
                        </span>
                    ),
                    children: (
                        <div className="p-2">
                            {vehicleAssignment.penalties.map((penalty, index) => (
                                <div key={penalty.id} className={`${index > 0 ? "mt-4 pt-4 border-t" : ""} bg-orange-50 p-4 rounded-lg`}>
                                    <div className="flex items-center mb-3">
                                        <ToolOutlined className="text-orange-500 mr-2" />
                                        <span className="font-medium">Loại vi phạm:</span>
                                        <span className="ml-2">{penalty.violationType}</span>
                                        <Tag className="ml-2" color={getStatusColor(penalty.status)}>
                                            {penalty.status}
                                        </Tag>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-center">
                                            <FileTextOutlined className="mr-2 text-gray-500" />
                                            <span className="font-medium mr-1">Mô tả:</span>
                                            <span>{penalty.violationDescription}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <DollarOutlined className="mr-2 text-gray-500" />
                                            <span className="font-medium mr-1">Số tiền phạt:</span>
                                            <span>{formatCurrency(penalty.penaltyAmount)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <CalendarOutlined className="mr-2 text-gray-500" />
                                            <span className="font-medium mr-1">Ngày vi phạm:</span>
                                            <span>{formatDate(penalty.penaltyDate)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <EnvironmentOutlined className="mr-2 text-gray-500" />
                                            <span className="font-medium mr-1">Địa điểm:</span>
                                            <span>{penalty.location}</span>
                                        </div>
                                        {penalty.paymentDate && (
                                            <div className="flex items-center">
                                                <CalendarOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Ngày thanh toán:</span>
                                                <span>{formatDate(penalty.paymentDate)}</span>
                                            </div>
                                        )}
                                        {penalty.disputeReason && (
                                            <div className="flex items-center">
                                                <FileTextOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Lý do khiếu nại:</span>
                                                <span>{penalty.disputeReason}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ),
                },
            ]
            : []),
        ...(vehicleAssignment.orderSeals && vehicleAssignment.orderSeals.length > 0
            ? [
                {
                    key: "seals",
                    label: (
                        <span>
                            <FileTextOutlined /> Niêm phong
                        </span>
                    ),
                    children: (
                        <div className="p-2">
                            {vehicleAssignment.orderSeals.map((seal, idx) => (
                                <div key={seal.id} className={`${idx > 0 ? "mt-3" : ""} bg-gray-50 p-4 rounded-lg`}>
                                    <div className="flex items-center mb-2">
                                        <FileTextOutlined className="mr-2 text-blue-500" />
                                        <span className="font-medium mr-1">Mô tả:</span>
                                        <span>{seal.description}</span>
                                    </div>
                                    <div className="flex items-center mb-2">
                                        <CalendarOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Ngày niêm phong:</span>
                                        <span>{formatDate(seal.sealDate)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <TagOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Trạng thái:</span>
                                        <Tag color={getStatusColor(seal.status)}>{seal.status}</Tag>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ),
                },
            ]
            : []),
        ...(vehicleAssignment.cameraTrackings && vehicleAssignment.cameraTrackings.length > 0
            ? [
                {
                    key: "camera",
                    label: (
                        <span>
                            <CameraOutlined /> Theo dõi camera
                        </span>
                    ),
                    children: (
                        <div className="p-2">
                            {vehicleAssignment.cameraTrackings.map((tracking, index) => (
                                <div key={tracking.id} className={`${index > 0 ? "mt-4" : ""} bg-gray-50 p-4 rounded-lg`}>
                                    <div className="flex items-center mb-2">
                                        <CameraOutlined className="mr-2 text-blue-500" />
                                        <span className="font-medium mr-1">Thiết bị:</span>
                                        <span>{tracking.deviceName}</span>
                                    </div>
                                    <div className="flex items-center mb-2">
                                        <CalendarOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Thời gian:</span>
                                        <span>{formatDate(tracking.trackingAt)}</span>
                                    </div>
                                    <div className="flex items-center mb-2">
                                        <TagOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Trạng thái:</span>
                                        <Tag color={getStatusColor(tracking.status)}>{tracking.status}</Tag>
                                    </div>
                                    {tracking.videoUrl && (
                                        <div className="mt-2">
                                            <a href={tracking.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center">
                                                <CameraOutlined className="mr-2" />
                                                Xem video
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ),
                },
            ]
            : []),
        ...(vehicleAssignment.photoCompletions && vehicleAssignment.photoCompletions.length > 0
            ? [
                {
                    key: "photos",
                    label: (
                        <span>
                            <CameraOutlined /> Hình ảnh hoàn thành
                        </span>
                    ),
                    children: (
                        <div className="p-2">
                            <div className="flex items-center mb-3">
                                <CameraOutlined className="mr-2 text-blue-500" />
                                <span className="font-medium">Hình ảnh hoàn thành:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {vehicleAssignment.photoCompletions.map((url, idx) => (
                                    <Image
                                        key={idx}
                                        src={url}
                                        alt={`Completion photo ${idx + 1}`}
                                        width={100}
                                        height={100}
                                        className="object-cover rounded"
                                    />
                                ))}
                            </div>
                        </div>
                    ),
                },
            ]
            : []),
        ...(vehicleAssignment.fuelConsumption
            ? [
                {
                    key: "fuel",
                    label: (
                        <span>
                            <FireOutlined /> Tiêu thụ nhiên liệu
                        </span>
                    ),
                    children: (
                        <div className="p-2">
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center">
                                        <DashboardOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Chỉ số đồng hồ khi nạp:</span>
                                        <span>{vehicleAssignment.fuelConsumption.odometerReadingAtRefuel} km</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FireOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Loại nhiên liệu:</span>
                                        <span>{vehicleAssignment.fuelConsumption.fuelTypeName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FileTextOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Mô tả nhiên liệu:</span>
                                        <span>{vehicleAssignment.fuelConsumption.fuelTypeDescription}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CalendarOutlined className="mr-2 text-gray-500" />
                                        <span className="font-medium mr-1">Ngày ghi nhận:</span>
                                        <span>{formatDate(vehicleAssignment.fuelConsumption.dateRecorded)}</span>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-start">
                                        <FileTextOutlined className="mr-2 text-gray-500 mt-1" />
                                        <span className="font-medium mr-1">Ghi chú:</span>
                                        <span>{vehicleAssignment.fuelConsumption.notes || "Không có ghi chú"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {vehicleAssignment.fuelConsumption.odometerAtStartUrl && (
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <DashboardOutlined className="mr-2 text-blue-500" />
                                            <span className="font-medium">Đồng hồ khi bắt đầu</span>
                                        </div>
                                        <Image
                                            src={vehicleAssignment.fuelConsumption.odometerAtStartUrl}
                                            alt="Odometer at start"
                                            className="object-cover rounded"
                                        />
                                    </div>
                                )}
                                {vehicleAssignment.fuelConsumption.odometerAtFinishUrl && (
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <DashboardOutlined className="mr-2 text-blue-500" />
                                            <span className="font-medium">Đồng hồ khi hoàn thành</span>
                                        </div>
                                        <Image
                                            src={vehicleAssignment.fuelConsumption.odometerAtFinishUrl}
                                            alt="Odometer at finish"
                                            className="object-cover rounded"
                                        />
                                    </div>
                                )}
                                {vehicleAssignment.fuelConsumption.odometerAtEndUrl && (
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <DashboardOutlined className="mr-2 text-blue-500" />
                                            <span className="font-medium">Đồng hồ khi kết thúc</span>
                                        </div>
                                        <Image
                                            src={vehicleAssignment.fuelConsumption.odometerAtEndUrl}
                                            alt="Odometer at end"
                                            className="object-cover rounded"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ),
                },
            ]
            : []),
    ];

    return (
        <Card
            title={
                <div className="flex items-center">
                    <CarOutlined className="mr-2 text-blue-500" />
                    <span>Chi tiết phương tiện</span>
                </div>
            }
            className="shadow-md mb-6 rounded-xl"
            size="small"
        >
            <Tabs defaultActiveKey="vehicle" items={tabItems} />
        </Card>
    );
};

export default VehicleInfoSection; 