import React, { useState } from 'react';
import { Modal, Button, Typography, App } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { UserModel } from '@/models/User';
import EditPersonalInfoForm from './EditPersonalInfoForm';

const { Text } = Typography;

interface EditPersonalInfoModalProps {
    userData: UserModel;
    onRefresh?: () => void;
}

const EditPersonalInfoModal: React.FC<EditPersonalInfoModalProps> = ({ userData, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { message } = App.useApp();

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);

        // Ensure success message appears after modal closes
        setTimeout(() => {
            message.success({
                content: 'Thông tin cá nhân đã được cập nhật thành công',
                duration: 5,
                className: 'custom-message-success'
            });

            // Refresh data after update
            if (onRefresh) {
                onRefresh();
            }
        }, 100);
    };

    return (
        <>
            <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={showModal}
                className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300 flex items-center"
                size="middle"
            >
                Chỉnh sửa thông tin
            </Button>
            <Modal
                title={
                    <div className="flex flex-col">
                        <Text className="text-xl font-medium">Chỉnh sửa thông tin cá nhân</Text>
                        <Text className="text-gray-500 text-sm">Cập nhật thông tin cá nhân của bạn</Text>
                    </div>
                }
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                width={600}
                className="edit-personal-info-modal"
                maskClosable={false}
                destroyOnClose
            >
                <EditPersonalInfoForm
                    userData={userData}
                    onSuccess={handleSuccess}
                />
            </Modal>
        </>
    );
};

export default EditPersonalInfoModal; 