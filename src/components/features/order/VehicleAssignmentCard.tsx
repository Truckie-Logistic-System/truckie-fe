import React from 'react';
import { Card } from 'antd';

interface VehicleAssignmentProps {
    vehicleAssignment: {
        id: string;
        vehicleId: string;
        driverId: string;
        description: string;
        status: string;
    };
}

const VehicleAssignmentCard: React.FC<VehicleAssignmentProps> = ({ vehicleAssignment }) => {
    return (
        <Card
            title={
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Thông tin phân công</span>
                </div>
            }
            className="shadow-md rounded-xl"
        >
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">ID phương tiện</h4>
                        <p className="font-medium">{vehicleAssignment.vehicleId}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">ID tài xế</h4>
                        <p className="font-medium">{vehicleAssignment.driverId}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">Trạng thái</h4>
                        <p className="font-medium">{vehicleAssignment.status}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">Mô tả</h4>
                        <p className="font-medium">{vehicleAssignment.description || 'Không có mô tả'}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default VehicleAssignmentCard; 