import React from "react";
import { Card, Descriptions, Tag, Tabs, Timeline, Image, Empty } from "antd";
import { CarOutlined, ToolOutlined, HistoryOutlined, FileTextOutlined, CameraOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { TabPane } = Tabs;

interface VehicleInfoSectionProps {
    vehicleAssignment?: {
        id: string;
        vehicle: {
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
        photoCompletions?: string[];
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
            >
                <Empty description="Chưa có thông tin phương tiện vận chuyển" />
            </Card>
        );
    }

    const tabItems = [
        {
            key: "vehicle",
            label: (
                <span>
                    <CarOutlined /> Thông tin phương tiện
                </span>
            ),
            children: (
                <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                    <Descriptions.Item label="Nhà sản xuất">{vehicleAssignment.vehicle.manufacturer || "Chưa có thông tin"}</Descriptions.Item>
                    <Descriptions.Item label="Mẫu xe">{vehicleAssignment.vehicle.model || "Chưa có thông tin"}</Descriptions.Item>
                    <Descriptions.Item label="Biển số xe">{vehicleAssignment.vehicle.licensePlateNumber || "Chưa có thông tin"}</Descriptions.Item>
                    <Descriptions.Item label="Loại xe">{vehicleAssignment.vehicle.vehicleType || "Chưa có thông tin"}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {vehicleAssignment.status ? (
                            <Tag color={getStatusColor(vehicleAssignment.status)}>{vehicleAssignment.status}</Tag>
                        ) : (
                            "Chưa có thông tin"
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tài xế chính">
                        {vehicleAssignment.primaryDriver
                            ? `${vehicleAssignment.primaryDriver.fullName} (${vehicleAssignment.primaryDriver.phoneNumber})`
                            : "Chưa có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tài xế phụ">
                        {vehicleAssignment.secondaryDriver
                            ? `${vehicleAssignment.secondaryDriver.fullName} (${vehicleAssignment.secondaryDriver.phoneNumber})`
                            : "Chưa có thông tin"}
                    </Descriptions.Item>
                </Descriptions>
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
                        <div>
                            {vehicleAssignment.issues.map((issueItem, index) => (
                                <div key={issueItem.issue.id} className={index > 0 ? "mt-6 pt-6 border-t" : ""}>
                                    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                                        <Descriptions.Item label="Mô tả">{issueItem.issue.description}</Descriptions.Item>
                                        <Descriptions.Item label="Trạng thái">
                                            <Tag color={getStatusColor(issueItem.issue.status)}>{issueItem.issue.status}</Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Loại sự cố">{issueItem.issue.issueTypeName}</Descriptions.Item>
                                        <Descriptions.Item label="Nhân viên xử lý">
                                            {issueItem.issue.staff.name} ({issueItem.issue.staff.phone})
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Vị trí">
                                            {issueItem.issue.locationLatitude}, {issueItem.issue.locationLongitude}
                                        </Descriptions.Item>
                                    </Descriptions>

                                    {issueItem.imageUrls && issueItem.imageUrls.length > 0 ? (
                                        <div className="mt-4">
                                            <p className="font-medium mb-2">Hình ảnh:</p>
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
                                        <p className="mt-4 mb-0">
                                            <span className="font-medium">Hình ảnh:</span> Chưa có hình ảnh
                                        </p>
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
                        <Timeline
                            mode="left"
                            items={vehicleAssignment.journeyHistories.map((journey) => ({
                                label: formatDate(journey.startTime),
                                children: (
                                    <div>
                                        <p><span className="font-medium">Trạng thái:</span> {journey.status}</p>
                                        <p><span className="font-medium">Thời gian kết thúc:</span> {formatDate(journey.endTime)}</p>
                                        <p><span className="font-medium">Tổng quãng đường:</span> {journey.totalDistance} km</p>
                                        {journey.isReportedIncident && (
                                            <Tag color="red">Có báo cáo sự cố</Tag>
                                        )}
                                    </div>
                                ),
                            }))}
                        />
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
                        <div>
                            {vehicleAssignment.penalties.map((penalty, index) => (
                                <div key={penalty.id} className={index > 0 ? "mt-6 pt-6 border-t" : ""}>
                                    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                                        <Descriptions.Item label="Loại vi phạm">{penalty.violationType}</Descriptions.Item>
                                        <Descriptions.Item label="Mô tả">{penalty.violationDescription}</Descriptions.Item>
                                        <Descriptions.Item label="Số tiền phạt">{formatCurrency(penalty.penaltyAmount)}</Descriptions.Item>
                                        <Descriptions.Item label="Ngày vi phạm">{formatDate(penalty.penaltyDate)}</Descriptions.Item>
                                        <Descriptions.Item label="Địa điểm">{penalty.location}</Descriptions.Item>
                                        <Descriptions.Item label="Trạng thái">
                                            <Tag color={getStatusColor(penalty.status)}>{penalty.status}</Tag>
                                        </Descriptions.Item>
                                        {penalty.paymentDate && (
                                            <Descriptions.Item label="Ngày thanh toán">{formatDate(penalty.paymentDate)}</Descriptions.Item>
                                        )}
                                        {penalty.disputeReason && (
                                            <Descriptions.Item label="Lý do khiếu nại">{penalty.disputeReason}</Descriptions.Item>
                                        )}
                                    </Descriptions>
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
                        <div className="bg-gray-50 p-4 rounded-lg">
                            {vehicleAssignment.orderSeals.map((seal, idx) => (
                                <div key={seal.id} className={idx > 0 ? "mt-3 pt-3 border-t border-gray-200" : ""}>
                                    <p className="mb-1">
                                        <span className="font-medium">Mô tả:</span> {seal.description}
                                    </p>
                                    <p className="mb-1">
                                        <span className="font-medium">Ngày niêm phong:</span> {formatDate(seal.sealDate)}
                                    </p>
                                    <p className="mb-0">
                                        <span className="font-medium">Trạng thái:</span>{" "}
                                        <Tag color={getStatusColor(seal.status)}>{seal.status}</Tag>
                                    </p>
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
                        <div>
                            {vehicleAssignment.cameraTrackings.map((tracking, index) => (
                                <div key={tracking.id} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                                    <p>
                                        <span className="font-medium">Thiết bị:</span> {tracking.deviceName}
                                    </p>
                                    <p>
                                        <span className="font-medium">Thời gian:</span> {formatDate(tracking.trackingAt)}
                                    </p>
                                    <p>
                                        <span className="font-medium">Trạng thái:</span>{" "}
                                        <Tag color={getStatusColor(tracking.status)}>{tracking.status}</Tag>
                                    </p>
                                    {tracking.videoUrl && (
                                        <div className="mt-2">
                                            <p className="font-medium mb-1">Video:</p>
                                            <a href={tracking.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
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
                            <CarOutlined /> Tiêu thụ nhiên liệu
                        </span>
                    ),
                    children: (
                        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                            <Descriptions.Item label="Chỉ số đồng hồ khi nạp">
                                {vehicleAssignment.fuelConsumption.odometerReadingAtRefuel} km
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại nhiên liệu">{vehicleAssignment.fuelConsumption.fuelTypeName}</Descriptions.Item>
                            <Descriptions.Item label="Mô tả nhiên liệu">{vehicleAssignment.fuelConsumption.fuelTypeDescription}</Descriptions.Item>
                            <Descriptions.Item label="Ngày ghi nhận">{formatDate(vehicleAssignment.fuelConsumption.dateRecorded)}</Descriptions.Item>
                            <Descriptions.Item label="Ghi chú" span={2}>{vehicleAssignment.fuelConsumption.notes || "Không có ghi chú"}</Descriptions.Item>
                            {vehicleAssignment.fuelConsumption.odometerAtStartUrl && (
                                <Descriptions.Item label="Ảnh đồng hồ khi bắt đầu">
                                    <Image
                                        src={vehicleAssignment.fuelConsumption.odometerAtStartUrl}
                                        alt="Odometer at start"
                                        width={100}
                                        height={100}
                                        className="object-cover rounded"
                                    />
                                </Descriptions.Item>
                            )}
                            {vehicleAssignment.fuelConsumption.odometerAtFinishUrl && (
                                <Descriptions.Item label="Ảnh đồng hồ khi hoàn thành">
                                    <Image
                                        src={vehicleAssignment.fuelConsumption.odometerAtFinishUrl}
                                        alt="Odometer at finish"
                                        width={100}
                                        height={100}
                                        className="object-cover rounded"
                                    />
                                </Descriptions.Item>
                            )}
                            {vehicleAssignment.fuelConsumption.odometerAtEndUrl && (
                                <Descriptions.Item label="Ảnh đồng hồ khi kết thúc">
                                    <Image
                                        src={vehicleAssignment.fuelConsumption.odometerAtEndUrl}
                                        alt="Odometer at end"
                                        width={100}
                                        height={100}
                                        className="object-cover rounded"
                                    />
                                </Descriptions.Item>
                            )}
                        </Descriptions>
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
                    <span>Thông tin phương tiện vận chuyển</span>
                </div>
            }
            className="shadow-md mb-6 rounded-xl"
        >
            <Tabs defaultActiveKey="vehicle" items={tabItems} />
        </Card>
    );
};

export default VehicleInfoSection; 