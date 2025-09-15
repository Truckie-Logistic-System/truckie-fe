import React, { useState } from "react";
import { Table, Button, Space, Tag, Popconfirm, App, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { VehicleAssignment } from "../../../../models";
import { VehicleAssignmentStatus } from "../../../../models/Vehicle";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import vehicleService from "../../../../services/vehicle";
import driverService from "../../../../services/driver";

interface VehicleAssignmentListProps {
    data: VehicleAssignment[];
    loading: boolean;
    onEdit: (record: VehicleAssignment) => void;
    onDelete: (id: string) => void;
    isAdmin?: boolean;
}

const VehicleAssignmentList: React.FC<VehicleAssignmentListProps> = ({
    data,
    loading,
    onEdit,
    onDelete,
    isAdmin = true,
}) => {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({});
    const [driverMap, setDriverMap] = useState<Record<string, string>>({});

    // Fetch vehicles for mapping
    useQuery({
        queryKey: ["vehicles-for-mapping"],
        queryFn: async () => {
            const response = await vehicleService.getVehicles();
            const map: Record<string, string> = {};
            response.data.forEach((vehicle) => {
                map[vehicle.id] = `${vehicle.licensePlateNumber} - ${vehicle.model}`;
            });
            setVehicleMap(map);
            return response;
        },
    });

    // Fetch drivers for mapping
    useQuery({
        queryKey: ["drivers-for-mapping"],
        queryFn: async () => {
            const response = await driverService.getAllDrivers();
            const map: Record<string, string> = {};
            response.forEach((driver) => {
                map[driver.id] = driver.userResponse.fullName;
            });
            setDriverMap(map);
            return response;
        },
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case VehicleAssignmentStatus.ACTIVE:
                return "success";
            case VehicleAssignmentStatus.INACTIVE:
                return "error";
            case VehicleAssignmentStatus.PENDING:
                return "warning";
            default:
                return "default";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case VehicleAssignmentStatus.ACTIVE:
                return "Hoạt động";
            case VehicleAssignmentStatus.INACTIVE:
                return "Không hoạt động";
            case VehicleAssignmentStatus.PENDING:
                return "Chờ xử lý";
            default:
                return status;
        }
    };

    // Helper function to truncate text and add tooltip
    const truncateText = (text: string, maxLength: number = 20) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return (
            <Tooltip title={text}>
                {text.substring(0, maxLength)}...
            </Tooltip>
        );
    };

    const handleViewDetails = (record: VehicleAssignment) => {
        const basePath = isAdmin ? "/admin" : "/staff";
        navigate(`${basePath}/vehicle-assignments/${record.id}`);
    };

    const columns: ColumnsType<VehicleAssignment> = [
        {
            title: "Xe",
            dataIndex: "vehicleId",
            key: "vehicleId",
            width: 180,
            render: (vehicleId) => {
                const vehicleText = vehicleMap[vehicleId] || vehicleId;
                return truncateText(vehicleText, 15);
            },
        },
        {
            title: "Tài xế chính",
            dataIndex: "driver_id_1",
            key: "driver_id_1",
            width: 150,
            render: (driverId) => {
                const driverText = driverMap[driverId] || driverId;
                return truncateText(driverText, 15);
            },
        },
        {
            title: "Tài xế phụ",
            dataIndex: "driver_id_2",
            key: "driver_id_2",
            width: 150,
            render: (driverId) => {
                if (!driverId) return "Không có";
                const driverText = driverMap[driverId] || driverId;
                return truncateText(driverText, 15);
            },
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (description) => (
                <Tooltip title={description || "Không có mô tả"}>
                    <div className="truncate max-w-[200px]">
                        {description || "Không có mô tả"}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => (
                <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            fixed: 'right',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="default"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Sửa">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Popconfirm
                            title="Xác nhận xóa"
                            description="Bạn có chắc chắn muốn xóa phân công này?"
                            onConfirm={() => onDelete(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                        >
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            className="overflow-x-auto"
            size="middle"
        />
    );
};

export default VehicleAssignmentList; 