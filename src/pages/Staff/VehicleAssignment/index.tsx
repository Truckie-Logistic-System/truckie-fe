import React, { useState } from "react";
import { Modal, App } from "antd";
import { SwapOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VehicleAssignment, CreateVehicleAssignmentRequest, UpdateVehicleAssignmentRequest } from "../../../models";
import { vehicleAssignmentService } from "../../../services/vehicle-assignment";
import { VehicleAssignmentStatus } from "../../../models/Vehicle";
import EntityManagementLayout from "../../../components/features/admin/EntityManagementLayout";

// Import components from Admin version to reuse
import VehicleAssignmentList from "../../Admin/VehicleAssignment/components/VehicleAssignmentList";
import VehicleAssignmentForm from "../../Admin/VehicleAssignment/components/VehicleAssignmentForm";

const StaffVehicleAssignmentPage: React.FC = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<VehicleAssignment | undefined>(undefined);
    const [searchText, setSearchText] = useState("");

    // Fetch vehicle assignments
    const {
        data: assignmentsData,
        isLoading,
        isError,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ["staffVehicleAssignments"],
        queryFn: () => vehicleAssignmentService.getAll(),
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateVehicleAssignmentRequest) => vehicleAssignmentService.create(data),
        onSuccess: () => {
            message.success("Tạo chuyến xe thành công");
            queryClient.invalidateQueries({ queryKey: ["staffVehicleAssignments"] });
            setIsModalOpen(false);
        },
        onError: (error) => {
            message.error("Có lỗi xảy ra khi tạo chuyến xe");
            console.error("Error creating vehicle assignment:", error);
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVehicleAssignmentRequest }) =>
            vehicleAssignmentService.update(id, data),
        onSuccess: () => {
            message.success("Cập nhật chuyến xe thành công");
            queryClient.invalidateQueries({ queryKey: ["staffVehicleAssignments"] });
            setIsModalOpen(false);
            setEditingAssignment(undefined);
        },
        onError: (error) => {
            message.error("Có lỗi xảy ra khi cập nhật chuyến xe");
            console.error("Error updating vehicle assignment:", error);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => vehicleAssignmentService.delete(id),
        onSuccess: () => {
            message.success("Xóa chuyến xe thành công");
            queryClient.invalidateQueries({ queryKey: ["staffVehicleAssignments"] });
        },
        onError: (error) => {
            message.error("Có lỗi xảy ra khi xóa chuyến xe");
            console.error("Error deleting vehicle assignment:", error);
        },
    });

    const handleOpenModal = () => {
        setEditingAssignment(undefined);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAssignment(undefined);
    };

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
            const newValues: CreateVehicleAssignmentRequest = {
                ...values as CreateVehicleAssignmentRequest,
                status: VehicleAssignmentStatus.ACTIVE
            };
            createMutation.mutate(newValues);
        }
    };

    // Filter assignments based on search text
    const filteredAssignments = assignmentsData?.data?.filter(assignment => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            assignment.trackingCode?.toLowerCase().includes(searchLower) ||
            assignment.status.toLowerCase().includes(searchLower)
        );
    });

    // Count assignments by status
    const activeCount = assignmentsData?.data?.filter(
        assignment => assignment.status === VehicleAssignmentStatus.ACTIVE
    ).length || 0;

    const inactiveCount = assignmentsData?.data?.filter(
        assignment => assignment.status === VehicleAssignmentStatus.INACTIVE
    ).length || 0;

    return (
        <EntityManagementLayout
            title="Quản lý chuyến xe"
            icon={<SwapOutlined />}
            description="Quản lý các chuyến xe và tài xế"
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
            tableTitle="Danh sách chuyến xe"
            tableComponent={
                isError ? (
                    <div className="text-red-500">
                        Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
                    </div>
                ) : (
                    <VehicleAssignmentList
                        data={filteredAssignments || []}
                        loading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isAdmin={false}
                    />
                )
            }
            modalComponent={
                <Modal
                    title={editingAssignment ? "Cập nhật chuyến xe" : "Tạo chuyến xe mới"}
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    maskClosable={false}
                    destroyOnClose
                >
                    <VehicleAssignmentForm
                        initialValues={editingAssignment}
                        onSubmit={handleSubmit}
                        isSubmitting={createMutation.isPending || updateMutation.isPending}
                    />
                </Modal>
            }
        />
    );
};

export default StaffVehicleAssignmentPage; 