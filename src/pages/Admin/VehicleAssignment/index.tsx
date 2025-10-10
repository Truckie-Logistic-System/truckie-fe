import React, { useState } from "react";
import { Modal, App, Select, Button } from "antd";
import { SwapOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VehicleAssignmentList, VehicleAssignmentForm, VehicleAssignmentSkeleton } from "./components";
import type { VehicleAssignment, CreateVehicleAssignmentRequest, UpdateVehicleAssignmentRequest, Order } from "../../../models";
import { vehicleAssignmentService } from "../../../services/vehicle-assignment";
import EntityManagementLayout from "../../../components/features/admin/EntityManagementLayout";
import { VehicleAssignmentEnum } from "../../../constants/enums";
import { VehicleAssignmentTag } from "../../../components/common";
import orderService from "../../../services/order";
import type { RouteSegment } from "../../../models/RoutePoint";
import type { RouteInfo, GroupAssignment } from "../../../models/VehicleAssignment";

const VehicleAssignmentPage: React.FC = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<VehicleAssignment | undefined>(undefined);
    const [searchText, setSearchText] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
    const [isOrderSelectModalOpen, setIsOrderSelectModalOpen] = useState(false);

    // Fetch vehicle assignments
    const {
        data: assignmentsData,
        isLoading,
        isError,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ["vehicleAssignments"],
        queryFn: () => vehicleAssignmentService.getAll(),
    });

    // Fetch orders
    const {
        data: ordersData,
        isLoading: isLoadingOrders,
    } = useQuery({
        queryKey: ["orders"],
        queryFn: () => orderService.getAllOrders(),
        enabled: isOrderSelectModalOpen, // Only fetch when order select modal is open
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateVehicleAssignmentRequest & {
            routeSegments?: RouteSegment[],
            orderId?: string,
            routeInfo?: RouteInfo
        }) => {
            const { routeSegments, orderId, routeInfo, ...assignmentData } = data;

            // Bắt buộc phải có route info khi tạo phân công
            if (!routeInfo) {
                throw new Error("Phải có thông tin định tuyến khi tạo phân công xe");
            }

            // Tạo phân công nhóm với route info
            const groupAssignment: GroupAssignment = {
                orderDetailIds: orderId ? [orderId] : [], // Nếu có orderId, thêm vào orderDetailIds
                vehicleId: assignmentData.vehicleId,
                driverId_1: assignmentData.driverId_1,
                driverId_2: assignmentData.driverId_2 || '',
                description: assignmentData.description,
                routeInfo: routeInfo
            };

            // Gọi API duy nhất để tạo phân công kèm thông tin route
            return vehicleAssignmentService.createGroupedAssignments({
                groupAssignments: [groupAssignment]
            });
        },
        onSuccess: () => {
            message.success("Tạo phân công xe thành công");
            queryClient.invalidateQueries({ queryKey: ["vehicleAssignments"] });
            setIsModalOpen(false);
            setSelectedOrderId(undefined);
        },
        onError: (error) => {
            message.error("Có lỗi xảy ra khi tạo phân công xe: " + (error instanceof Error ? error.message : ""));
            console.error("Error creating vehicle assignment:", error);
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVehicleAssignmentRequest }) =>
            vehicleAssignmentService.update(id, data),
        onSuccess: () => {
            message.success("Cập nhật phân công xe thành công");
            queryClient.invalidateQueries({ queryKey: ["vehicleAssignments"] });
            setIsModalOpen(false);
            setEditingAssignment(undefined);
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
            queryClient.invalidateQueries({ queryKey: ["vehicleAssignments"] });
        },
        onError: (error) => {
            message.error("Có lỗi xảy ra khi xóa phân công xe");
            console.error("Error deleting vehicle assignment:", error);
        },
    });

    const handleOpenModal = () => {
        setIsOrderSelectModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAssignment(undefined);
        setSelectedOrderId(undefined);
    };

    const handleCloseOrderSelectModal = () => {
        setIsOrderSelectModalOpen(false);
    };

    const handleOrderSelect = (orderId: string) => {
        setSelectedOrderId(orderId);
        setIsOrderSelectModalOpen(false);
        setIsModalOpen(true);
    };

    // Xóa hàm handleCreateWithoutOrder vì không cho phép tạo phân công không có route
    // const handleCreateWithoutOrder = () => {
    //     setSelectedOrderId(undefined);
    //     setIsOrderSelectModalOpen(false);
    //     setIsModalOpen(true);
    // };

    const handleEdit = (record: VehicleAssignment) => {
        setEditingAssignment(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleSubmit = async (values: CreateVehicleAssignmentRequest | UpdateVehicleAssignmentRequest) => {
        if (editingAssignment) {
            // Khi chỉnh sửa, chỉ gửi các trường được phép thay đổi
            const updatedValues: UpdateVehicleAssignmentRequest = {
                driverId_1: values.driverId_1,
                driverId_2: values.driverId_2,
                description: values.description,
            };
            updateMutation.mutate({ id: editingAssignment.id, data: updatedValues });
        } else {
            // Khi tạo mới, đảm bảo status là ACTIVE
            const newValues: CreateVehicleAssignmentRequest & {
                routeSegments?: RouteSegment[],
                orderId?: string,
                routeInfo?: RouteInfo
            } = {
                ...values as CreateVehicleAssignmentRequest,
                status: VehicleAssignmentEnum.ASSIGNED_TO_DRIVER
            };
            createMutation.mutate(newValues);
        }
    };

    // Filter assignments based on search text
    const filteredAssignments = assignmentsData?.data?.filter(assignment => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            assignment.id.toLowerCase().includes(searchLower) ||
            assignment.description?.toLowerCase().includes(searchLower) ||
            assignment.status.toLowerCase().includes(searchLower)
        );
    });

    // Count assignments by status
    const activeCount = assignmentsData?.data?.filter(
        assignment => assignment.status === VehicleAssignmentEnum.ASSIGNED_TO_DRIVER
    ).length || 0;

    const inactiveCount = assignmentsData?.data?.filter(
        assignment => assignment.status === VehicleAssignmentEnum.UNASSIGNED
    ).length || 0;

    // Render skeleton if loading
    if (isLoading) {
        return <VehicleAssignmentSkeleton />;
    }

    return (
        <EntityManagementLayout
            title="Quản lý phân công xe"
            icon={<SwapOutlined />}
            description="Quản lý phân công xe và tài xế"
            addButtonText="Tạo phân công mới"
            addButtonIcon={<PlusOutlined />}
            onAddClick={handleOpenModal}
            searchText={searchText}
            onSearchChange={setSearchText}
            onRefresh={refetch}
            isLoading={isLoading}
            isFetching={isFetching}
            totalCount={assignmentsData?.data?.length || 0}
            activeCount={activeCount}
            bannedCount={inactiveCount}
            tableTitle="Danh sách phân công xe"
            tableComponent={
                isError ? (
                    <div className="text-red-500">
                        Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
                    </div>
                ) : (
                    <VehicleAssignmentList
                        data={filteredAssignments || []}
                        loading={isFetching}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isAdmin={true}
                    />
                )
            }
            modalComponent={
                <>
                    <Modal
                        title="Chọn đơn hàng để phân công"
                        open={isOrderSelectModalOpen}
                        onCancel={handleCloseOrderSelectModal}
                        footer={null}
                        maskClosable={false}
                        destroyOnClose
                    >
                        <div className="mb-4">
                            <p className="mb-2">Chọn đơn hàng để phân công xe và định tuyến:</p>
                            <Select
                                placeholder="Chọn đơn hàng"
                                loading={isLoadingOrders}
                                className="w-full mb-4"
                                onChange={handleOrderSelect}
                            >
                                {ordersData?.map((order: Order) => (
                                    <Select.Option key={order.id} value={order.id}>
                                        {order.id} - {order.pickupAddress?.street || 'Địa chỉ không có'}
                                    </Select.Option>
                                ))}
                            </Select>
                            {/* Xóa nút "Tạo phân công không có đơn hàng" */}
                        </div>
                    </Modal>

                    <Modal
                        title={editingAssignment ? "Cập nhật phân công xe" : "Tạo phân công xe mới"}
                        open={isModalOpen}
                        onCancel={handleCloseModal}
                        footer={null}
                        maskClosable={false}
                        destroyOnClose
                        width={selectedOrderId ? 800 : 520}
                    >
                        <VehicleAssignmentForm
                            initialValues={editingAssignment}
                            onSubmit={handleSubmit}
                            isSubmitting={createMutation.isPending || updateMutation.isPending}
                            orderId={selectedOrderId}
                            requireRoute={true} // Thêm prop để yêu cầu route
                        />
                    </Modal>
                </>
            }
        />
    );
};

export default VehicleAssignmentPage; 