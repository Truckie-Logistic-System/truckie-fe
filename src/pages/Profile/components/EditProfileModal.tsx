import React, { useState } from 'react';
import { Modal, Button, Typography, App } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { Customer } from '@/models/Customer';
import EditProfileForm from './EditProfileForm';

const { Text } = Typography;

interface EditProfileModalProps {
    customerData: Customer;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ customerData }) => {
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

        // Đảm bảo thông báo thành công vẫn hiển thị sau khi modal đóng
        setTimeout(() => {
            message.success({
                content: 'Thông tin công ty đã được cập nhật thành công',
                duration: 5,
                className: 'custom-message-success'
            });
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
                        <Text className="text-xl font-medium">Chỉnh sửa thông tin công ty</Text>
                        <Text className="text-gray-500 text-sm">Cập nhật thông tin doanh nghiệp của bạn</Text>
                    </div>
                }
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                width={700}
                className="edit-profile-modal"
                maskClosable={false}
                destroyOnClose
            >
                <EditProfileForm
                    customerData={customerData}
                    onSuccess={handleSuccess}
                />
            </Modal>
        </>
    );
};

export default EditProfileModal; 