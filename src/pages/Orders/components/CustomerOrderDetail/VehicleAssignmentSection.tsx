import React from "react";
import { Card, Descriptions, Empty, Tabs, Tag, Timeline, Image } from "antd";
import { CarOutlined, ToolOutlined, HistoryOutlined, FileTextOutlined, CameraOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

interface VehicleAssignmentProps {
    vehicleAssignment?: {
        id: string;
        vehicleName: string;
        licensePlateNumber: string;
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
        issue?: {
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
        };
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
        journeyHistory?: {
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
    };
}

const VehicleAssignmentSection: React.FC<VehicleAssignmentProps> = ({ vehicleAssignment }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Chưa có thông tin";
        return dayjs(dateString).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss");
    };

    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            PENDING: "orange",
            PROCESSING: "blue",
            CANCELLED: "red",
            DELIVERED: "green",
            SUCCESSFUL: "green",
            IN_TROUBLES: "red",
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

    const items = [
        {
            key: "vehicle",
            label: (
                <span>
                    <CarOutlined /> Thông tin phương tiện
                </span>
            ),
            children: (
                <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }} size="small">
                    <Descriptions.Item label="Tên phương tiện">
                        {vehicleAssignment.vehicleName || "Chưa có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Biển số xe">
                        {vehicleAssignment.licensePlateNumber || "Chưa có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {vehicleAssignment.status ? (
                            <Tag color={getStatusColor(vehicleAssignment.status)}>
                                {vehicleAssignment.status}
                            </Tag>
                        ) : (
                            "Chưa có thông tin"
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tài xế chính">
                        {vehicleAssignment.primaryDriver
                            ? vehicleAssignment.primaryDriver.fullName
                            : "Chưa có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="SĐT tài xế chính">
                        {vehicleAssignment.primaryDriver
                            ? vehicleAssignment.primaryDriver.phoneNumber
                            : "Chưa có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tài xế phụ">
                        {vehicleAssignment.secondaryDriver
                            ? vehicleAssignment.secondaryDriver.fullName
                            : "Chưa có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="SĐT tài xế phụ">
                        {vehicleAssignment.secondaryDriver
                            ? vehicleAssignment.secondaryDriver.phoneNumber
                            : "Chưa có thông tin"}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        ...(vehicleAssignment.issue || vehicleAssignment.issues
            ? [
                {
                    key: "issues",
                    label: (
                        <span>
                            <ToolOutlined /> Sự cố
                        </span>
                    ),
                    children: vehicleAssignment.issues && vehicleAssignment.issues.length > 0 ? (
                        vehicleAssignment.issues.map((issueItem, index) => (
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
                        ))
                    ) : vehicleAssignment.issue ? (
                        <div>
                            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                                <Descriptions.Item label="Mô tả">{vehicleAssignment.issue.issue.description}</Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <Tag color={getStatusColor(vehicleAssignment.issue.issue.status)}>{vehicleAssignment.issue.issue.status}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Loại sự cố">{vehicleAssignment.issue.issue.issueTypeName}</Descriptions.Item>
                                <Descriptions.Item label="Nhân viên xử lý">
                                    {vehicleAssignment.issue.issue.staff.name} ({vehicleAssignment.issue.issue.staff.phone})
                                </Descriptions.Item>
                            </Descriptions>

                            {vehicleAssignment.issue.imageUrls && vehicleAssignment.issue.imageUrls.length > 0 ? (
                                <div className="mt-4">
                                    <p className="font-medium mb-2">Hình ảnh:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {vehicleAssignment.issue.imageUrls.map((url, idx) => (
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
                    ) : (
                        <Empty description="Chưa có thông tin sự cố" />
                    ),
                },
            ]
            : []),
        ...(vehicleAssignment.journeyHistory && vehicleAssignment.journeyHistory.length > 0
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
                            items={vehicleAssignment.journeyHistory.map((journey) => ({
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
            <Tabs defaultActiveKey="vehicle" items={items} />
        </Card>
    );
};

export default VehicleAssignmentSection; 