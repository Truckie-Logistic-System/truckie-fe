import React from 'react';
import { Card, Button } from 'antd';
import { CarOutlined } from '@ant-design/icons';
import type { Order } from '../../../models';

interface VehicleAssignmentProps {
    vehicleAssignment?: {
        id: string;
        vehicleId: string;
        driverId: string;
        description: string;
        status: string;
    };
    order?: Order;
    onAssignDriver?: () => void;
}

const VehicleAssignmentCard: React.FC<VehicleAssignmentProps> = ({ vehicleAssignment, order, onAssignDriver }) => {
    // Nếu có order, lấy vehicleAssignment từ order
    const assignmentData = order?.orderDetails?.[0]?.vehicleAssignmentId || vehicleAssignment;

    // Nếu không có dữ liệu, hiển thị nút phân công
    if (!assignmentData) {
        return (
            <Card
                title={
                    <div className="flex items-center">
                        <CarOutlined className="mr-2 text-blue-500" />
                        <span>Thông tin phân công</span>
                    </div>
                }
                className="shadow-md rounded-xl mb-6"
            >
                <div className="p-6 text-center">
                    <p className="text-gray-500 mb-4">Đơn hàng này chưa được phân công cho tài xế</p>
                    <Button
                        type="primary"
                        onClick={onAssignDriver}
                        className="bg-blue-600 hover:bg-blue-700"
                        icon={<CarOutlined />}
                    >
                        Phân công tài xế
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card
            title={
                <div className="flex items-center">
                    <CarOutlined className="mr-2 text-blue-500" />
                    <span>Thông tin phân công</span>
                </div>
            }
            className="shadow-md rounded-xl mb-6"
            extra={
                onAssignDriver && (
                    <Button
                        type="primary"
                        onClick={onAssignDriver}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="small"
                    >
                        Thay đổi
                    </Button>
                )
            }
        >
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">ID phương tiện</h4>
                        <p className="font-medium">{assignmentData.vehicleId}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">ID tài xế</h4>
                        <p className="font-medium">{assignmentData.driverId}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">Trạng thái</h4>
                        <p className="font-medium">{assignmentData.status}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">Mô tả</h4>
                        <p className="font-medium">{assignmentData.description || 'Không có mô tả'}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default VehicleAssignmentCard; 