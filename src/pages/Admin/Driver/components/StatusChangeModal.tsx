import React from 'react';
import { Modal, Radio, Tag, Avatar, Divider } from 'antd';
import { CheckCircleOutlined, StopOutlined, CarOutlined } from '@ant-design/icons';
import type { DriverModel } from '../../../../services/driver';

interface StatusChangeModalProps {
    visible: boolean;
    loading: boolean;
    driver: DriverModel | null;
    status: string;
    onStatusChange: (value: string) => void;
    onOk: () => void;
    onCancel: () => void;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
    visible,
    loading,
    driver,
    status,
    onStatusChange,
    onOk,
    onCancel
}) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'green';
            case 'banned':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'Hoạt động';
            case 'banned':
                return 'Bị cấm';
            default:
                return status;
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <CarOutlined className="text-blue-500 mr-2 text-xl" />
                    <span>Cập nhật trạng thái tài xế</span>
                </div>
            }
            open={visible}
            onOk={onOk}
            onCancel={onCancel}
            confirmLoading={loading}
            okText="Cập nhật"
            cancelText="Hủy"
            okButtonProps={{
                className: status.toLowerCase() === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            }}
            className="status-change-modal"
            width={400}
        >
            <div className="flex items-center mb-6">
                <Avatar
                    src={driver?.userResponse?.imageUrl}
                    size={50}
                    icon={<CarOutlined />}
                    className="mr-4 bg-blue-100"
                />
                <div>
                    <div className="font-medium text-lg">{driver?.userResponse?.fullName}</div>
                    <div className="text-gray-500">{driver?.userResponse?.phoneNumber}</div>
                </div>
            </div>

            <Divider className="my-4" />

            <div className="mb-4">
                <div className="text-gray-500 mb-2">Trạng thái hiện tại:</div>
                <Tag
                    color={getStatusColor(driver?.status || '')}
                    className="px-3 py-1 text-sm"
                    icon={driver?.status?.toLowerCase() === 'active' ? <CheckCircleOutlined /> : <StopOutlined />}
                >
                    {getStatusText(driver?.status || '')}
                </Tag>
            </div>

            <div className="mb-2">
                <div className="text-gray-500 mb-2">Chọn trạng thái mới:</div>
                <Radio.Group
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="w-full"
                >
                    <div className="grid grid-cols-1 gap-3">
                        <Radio.Button
                            value="ACTIVE"
                            className={`flex items-center h-auto py-2 px-3 ${status === 'ACTIVE' ? 'bg-green-50 border-green-500' : ''}`}
                        >
                            <CheckCircleOutlined className="text-green-500 mr-2" />
                            <div>
                                <div className="font-medium">Hoạt động</div>
                                <div className="text-xs text-gray-500">Tài xế có thể nhận và thực hiện đơn hàng</div>
                            </div>
                        </Radio.Button>

                        <Radio.Button
                            value="BANNED"
                            className={`flex items-center h-auto py-2 px-3 ${status === 'BANNED' ? 'bg-red-50 border-red-500' : ''}`}
                        >
                            <StopOutlined className="text-red-500 mr-2" />
                            <div>
                                <div className="font-medium">Cấm hoạt động</div>
                                <div className="text-xs text-gray-500">Tài xế không thể nhận và thực hiện đơn hàng</div>
                            </div>
                        </Radio.Button>
                    </div>
                </Radio.Group>
            </div>
        </Modal>
    );
};

export default StatusChangeModal; 