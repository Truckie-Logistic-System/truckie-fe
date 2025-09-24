import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Row,
    Col,
    Card,
    Avatar,
    Tag,
    Skeleton,
    Button,
    Breadcrumb,
    Divider,
    Modal,
    App
} from "antd";
import {
    CarOutlined,
    IdcardOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
    EditOutlined,
    ArrowLeftOutlined,
    DeleteOutlined
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleAssignmentService } from "../../../services/vehicle-assignment";
import vehicleService from "../../../services/vehicle";
import driverService from "../../../services/driver";
import { VehicleAssignmentStatus } from "../../../models/Vehicle";
import type { VehicleAssignment, UpdateVehicleAssignmentRequest } from "../../../models";
import VehicleAssignmentForm from "../../Admin/VehicleAssignment/components/VehicleAssignmentForm";
import { VehicleAssignmentTag } from '@/components/common/tags';
import { VehicleAssignmentEnum } from '@/constants/enums';

const VehicleAssignmentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Fetch vehicle assignment details
    const {
        data: assignmentData,
        isLoading: isLoadingAssignment,
        error: assignmentError,
        isError: isAssignmentError
    } = useQuery({
        queryKey: ["staffVehicleAssignment", id],
        queryFn: () => id ? vehicleAssignmentService.getById(id) : null,
        enabled: !!id,
    });

    const assignment = assignmentData?.data;

    // Fetch vehicle details
    const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
        queryKey: ["staff-vehicle-detail", assignment?.vehicleId],
        queryFn: () => (assignment?.vehicleId ? vehicleService.getVehicleById(assignment.vehicleId) : null),
        enabled: !!assignment?.vehicleId,
    });

    // Fetch primary driver details
    const { data: primaryDriverData, isLoading: isLoadingPrimaryDriver } = useQuery({
        queryKey: ["staff-driver-detail-primary", assignment?.driver_id_1],
        queryFn: () => (assignment?.driver_id_1 ? driverService.getDriverById(assignment.driver_id_1) : null),
        enabled: !!assignment?.driver_id_1,
    });

    // Fetch secondary driver details if exists
    const { data: secondaryDriverData, isLoading: isLoadingSecondaryDriver } = useQuery({
        queryKey: ["staff-driver-detail-secondary", assignment?.driver_id_2],
        queryFn: () => (assignment?.driver_id_2 ? driverService.getDriverById(assignment.driver_id_2) : null),
        enabled: !!assignment?.driver_id_2,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVehicleAssignmentRequest }) =>
            vehicleAssignmentService.update(id, data),
        onSuccess: () => {
            message.success("Cập nhật phân công xe thành công");
            queryClient.invalidateQueries({ queryKey: ["staffVehicleAssignment", id] });
            setIsEditModalOpen(false);
        },
        onError: (error) => {
            message.error("Có lỗi xảy ra khi cập nhật phân công xe");
            console.error("Error updating vehicle assignment:", error);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => vehicleAssignmentService.delete(id),
        onSuccess: () => {
            message.success("Xóa phân công xe thành công");
            navigate("/staff/vehicle-assignments");
        },
        onError: (error) => {
            message.error("Có lỗi xảy ra khi xóa phân công xe");
            console.error("Error deleting vehicle assignment:", error);
        },
    });

    // Đã sử dụng VehicleAssignmentTag thay cho các hàm status

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (values: UpdateVehicleAssignmentRequest) => {
        if (id) {
            // Chỉ gửi các trường được phép thay đổi (tài xế và mô tả)
            const updatedValues: UpdateVehicleAssignmentRequest = {
                driverId_1: values.driverId_1,
                driverId_2: values.driverId_2,
                description: values.description,
            };

            updateMutation.mutate({ id, data: updatedValues });
        }
    };

    const confirmDelete = () => {
        if (id) {
            deleteMutation.mutate(id);
        }
    };

    const isLoading = isLoadingAssignment || isLoadingVehicle || isLoadingPrimaryDriver || isLoadingSecondaryDriver;

    if (isAssignmentError) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Đã xảy ra lỗi</h3>
                    <p>Không thể tải thông tin phân công xe. Vui lòng thử lại sau.</p>
                    <Button
                        type="primary"
                        danger
                        className="mt-2"
                        onClick={() => navigate("/staff/vehicle-assignments")}
                    >
                        <ArrowLeftOutlined /> Quay lại danh sách
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Breadcrumb and actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Breadcrumb
                        items={[
                            { title: 'Trang chủ', href: '/staff/dashboard' },
                            { title: 'Phân công xe', href: '/staff/vehicle-assignments' },
                            { title: 'Chi tiết phân công' },
                        ]}
                        className="mb-2"
                    />
                    <h1 className="text-2xl font-bold text-gray-800">Chi tiết phân công xe</h1>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/staff/vehicle-assignments")}
                    >
                        Quay lại
                    </Button>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                    >
                        Chỉnh sửa
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDelete}
                    >
                        Xóa
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white p-6 rounded-lg shadow">
                    <Skeleton active paragraph={{ rows: 10 }} />
                </div>
            ) : assignment ? (
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
                                            <VehicleAssignmentTag status={assignment.status as VehicleAssignmentEnum} className="px-3 py-1 text-sm" />
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

                    <Row gutter={[16, 16]} className="mt-4">
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
            ) : null}

            {/* Edit Modal */}
            <Modal
                title="Chỉnh sửa phân công xe"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
                maskClosable={false}
                destroyOnClose
                width={700}
            >
                <VehicleAssignmentForm
                    initialValues={assignment}
                    onSubmit={handleSubmit}
                    isSubmitting={updateMutation.isPending}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Xác nhận xóa"
                open={isDeleteModalOpen}
                onCancel={() => setIsDeleteModalOpen(false)}
                onOk={confirmDelete}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            >
                <p>Bạn có chắc chắn muốn xóa phân công xe này?</p>
                <p>Hành động này không thể hoàn tác.</p>
            </Modal>
        </div>
    );
};

export default VehicleAssignmentDetailPage; 