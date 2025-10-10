import React from "react";
import { Card, Tag } from "antd";
import {
    CarOutlined,
    UserOutlined,
    PhoneOutlined,
    TagOutlined,
} from "@ant-design/icons";

interface VehicleInfoSectionProps {
    vehicleAssignment?: {
        id: string;
        trackingCode?: string;
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
    };
}

const VehicleInfoSection: React.FC<VehicleInfoSectionProps> = ({ vehicleAssignment }) => {
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
                <div className="text-center py-4">
                    <p className="text-gray-500">Chưa có thông tin phương tiện vận chuyển</p>
                </div>
            </Card>
        );
    }

    // Check if vehicle information is available
    const hasVehicleInfo = vehicleAssignment.vehicle !== null && vehicleAssignment.vehicle !== undefined;

    return (
        <Card
            title={
                <div className="flex items-center">
                    <CarOutlined className="mr-2 text-blue-500" />
                    <span>Thông tin phương tiện</span>
                </div>
            }
            className="shadow-md mb-6 rounded-xl"
            size="small"
        >
            <div className="p-2">
                <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                    {hasVehicleInfo ? (
                        <>
                            <div className="flex items-center mb-3">
                                <CarOutlined className="text-xl text-blue-500 mr-3" />
                                <span className="text-lg font-medium">{vehicleAssignment.vehicle?.licensePlateNumber || "Chưa có thông tin"}</span>
                                {vehicleAssignment.trackingCode && (
                                    <Tag color="blue" className="ml-2">{vehicleAssignment.trackingCode}</Tag>
                                )}
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
        </Card>
    );
};

export default VehicleInfoSection; 