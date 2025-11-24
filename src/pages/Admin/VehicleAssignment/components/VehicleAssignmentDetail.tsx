import React from "react";
import { Modal, Tag, Skeleton, Row, Col, Card, Avatar } from "antd";
import type { VehicleAssignment } from "../../../../models";
import { VehicleAssignmentStatus } from "../../../../models/Vehicle";
import { useQuery } from "@tanstack/react-query";
import vehicleService from "../../../../services/vehicle";
import driverService from "../../../../services/driver";
import {
    CarOutlined,
    IdcardOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";

interface VehicleAssignmentDetailProps {
    assignment: VehicleAssignment | null;
    visible: boolean;
    onClose: () => void;
}

const VehicleAssignmentDetail: React.FC<VehicleAssignmentDetailProps> = ({
    assignment,
    visible,
    onClose,
}) => {
    // Fetch vehicle details
    const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
        queryKey: ["vehicle-detail", assignment?.vehicleId],
        queryFn: () => (assignment?.vehicleId ? vehicleService.getVehicleById(assignment.vehicleId) : null),
        enabled: !!assignment?.vehicleId,
    });

    // Fetch primary driver details
    const { data: primaryDriverData, isLoading: isLoadingPrimaryDriver } = useQuery({
        queryKey: ["driver-detail-primary", assignment?.driver_id_1],
        queryFn: () => (assignment?.driver_id_1 ? driverService.getDriverById(assignment.driver_id_1) : null),
        enabled: !!assignment?.driver_id_1,
    });

    // Fetch secondary driver details if exists
    const { data: secondaryDriverData, isLoading: isLoadingSecondaryDriver } = useQuery({
        queryKey: ["driver-detail-secondary", assignment?.driver_id_2],
        queryFn: () => (assignment?.driver_id_2 ? driverService.getDriverById(assignment.driver_id_2) : null),
        enabled: !!assignment?.driver_id_2,
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case VehicleAssignmentStatus.ACTIVE:
                return "processing";
            case VehicleAssignmentStatus.INACTIVE:
                return "default";
            case VehicleAssignmentStatus.COMPLETED:
                return "success";
            default:
                return "default";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case VehicleAssignmentStatus.ACTIVE:
                return "Đang hoạt động";
            case VehicleAssignmentStatus.INACTIVE:
                return "Không hoạt động";
            case VehicleAssignmentStatus.COMPLETED:
                return "Hoàn thành";
            default:
                return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case VehicleAssignmentStatus.ACTIVE:
                return <CheckCircleOutlined />;
            case VehicleAssignmentStatus.INACTIVE:
                return <CloseCircleOutlined />;
            case VehicleAssignmentStatus.COMPLETED:
                return <CheckCircleOutlined />;
            default:
                return <InfoCircleOutlined />;
        }
    };

    const isLoading = isLoadingVehicle || isLoadingPrimaryDriver || isLoadingSecondaryDriver;

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <CarOutlined className="text-blue-500 text-xl mr-2" />
                    <span className="text-lg font-semibold">Chi tiết phân công xe</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1000}
            centered
            bodyStyle={{ padding: "16px", backgroundColor: "#f5f8ff" }}
            className="vehicle-assignment-modal"
        >
            {!assignment || isLoading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Card
                                className="shadow-sm hover:shadow-md transition-shadow border-blue-100"
                                headStyle={{ backgroundColor: "#f0f5ff", borderBottom: "1px solid #d6e4ff" }}
                                title={
                                    <div className="flex items-center">
                                        <InfoCircleOutlined className="text-blue-500 mr-2" />
                                        <span className="font-semibold">Thông tin phân công</span>
                                    </div>
                                }
                            >
                                <Row gutter={[16, 0]} className="items-center">
                                    <Col span={8}>
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <div className="text-gray-500 text-xs mb-1">ID phân công</div>
                                            <div className="font-mono text-sm break-all">{assignment.id}</div>
                                        </div>
                                    </Col>
                                    <Col span={8} className="text-center">
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <div className="text-gray-500 text-xs mb-1">Trạng thái</div>
                                            <Tag
                                                color={getStatusColor(assignment.status)}
                                                icon={getStatusIcon(assignment.status)}
                                                className="px-3 py-1 text-sm"
                                            >
                                                {getStatusText(assignment.status)}
                                            </Tag>
                                        </div>
                                    </Col>
                                    <Col span={8}>
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <div className="text-gray-500 text-xs mb-1">Mô tả</div>
                                            <div className="text-sm">{assignment.description || "Không có mô tả"}</div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card
                                className="shadow-sm hover:shadow-md transition-shadow border-blue-100 h-full"
                                headStyle={{ backgroundColor: "#f0f7ff", borderBottom: "1px solid #d6e4ff" }}
                                title={
                                    <div className="flex items-center">
                                        <CarOutlined className="text-blue-500 mr-2" />
                                        <span className="font-semibold">Thông tin xe</span>
                                    </div>
                                }
                            >
                                <div className="flex justify-center mb-4">
                                    <Avatar
                                        size={64}
                                        icon={<CarOutlined />}
                                        className="bg-blue-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                <CarOutlined className="text-blue-500" />
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">Biển số xe</div>
                                                <div className="font-semibold">{vehicleData?.data?.licensePlateNumber}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                <CarOutlined className="text-blue-500" />
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">Mẫu xe</div>
                                                <div className="font-semibold">{vehicleData?.data?.model}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                <CarOutlined className="text-blue-500" />
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">Nhà sản xuất</div>
                                                <div className="font-semibold">{vehicleData?.data?.manufacturer}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                <CarOutlined className="text-blue-500" />
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">Năm sản xuất</div>
                                                <div className="font-semibold">{vehicleData?.data?.year}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col span={12}>
                            <Card
                                className="shadow-sm hover:shadow-md transition-shadow border-blue-100 h-full"
                                headStyle={{ backgroundColor: "#f0f7ff", borderBottom: "1px solid #d6e4ff" }}
                                title={
                                    <div className="flex items-center">
                                        <UserOutlined className="text-blue-500 mr-2" />
                                        <span className="font-semibold">Tài xế chính</span>
                                    </div>
                                }
                            >
                                <div className="flex justify-center mb-4">
                                    <Avatar
                                        size={64}
                                        icon={<UserOutlined />}
                                        className="bg-green-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <UserOutlined className="text-green-500" />
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">Họ tên</div>
                                                <div className="font-semibold">{primaryDriverData?.userResponse?.fullName}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <PhoneOutlined className="text-green-500" />
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">Số điện thoại</div>
                                                <div className="font-semibold">{primaryDriverData?.userResponse?.phoneNumber}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <MailOutlined className="text-green-500" />
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">Email</div>
                                                <div className="font-semibold">{primaryDriverData?.userResponse?.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <IdcardOutlined className="text-green-500" />
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">Số giấy phép lái xe</div>
                                                <div className="font-semibold">{primaryDriverData?.driverLicenseNumber}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        {assignment.driver_id_2 && (
                            <Col span={24}>
                                <Card
                                    className="shadow-sm hover:shadow-md transition-shadow border-blue-100"
                                    headStyle={{ backgroundColor: "#f0f7ff", borderBottom: "1px solid #d6e4ff" }}
                                    title={
                                        <div className="flex items-center">
                                            <UserOutlined className="text-orange-500 mr-2" />
                                            <span className="font-semibold">Tài xế phụ</span>
                                        </div>
                                    }
                                >
                                    <div className="flex justify-center mb-4">
                                        <Avatar
                                            size={64}
                                            icon={<UserOutlined />}
                                            className="bg-orange-400"
                                        />
                                    </div>

                                    <Row gutter={[16, 16]}>
                                        <Col span={6}>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                                                        <UserOutlined className="text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-500 text-xs">Họ tên</div>
                                                        <div className="font-semibold">{secondaryDriverData?.userResponse?.fullName}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={6}>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                                                        <PhoneOutlined className="text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-500 text-xs">Số điện thoại</div>
                                                        <div className="font-semibold">{secondaryDriverData?.userResponse?.phoneNumber}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={6}>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                                                        <MailOutlined className="text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-500 text-xs">Email</div>
                                                        <div className="font-semibold">{secondaryDriverData?.userResponse?.email}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={6}>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                                                        <IdcardOutlined className="text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-500 text-xs">Số giấy phép lái xe</div>
                                                        <div className="font-semibold">{secondaryDriverData?.driverLicenseNumber}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        )}
                    </Row>
                </>
            )}
        </Modal>
    );
};

export default VehicleAssignmentDetail; 