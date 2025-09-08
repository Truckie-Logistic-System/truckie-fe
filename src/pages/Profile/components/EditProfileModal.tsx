import React, { useState } from 'react';
import { Modal, Button, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { CustomerResponse } from '../../../services/customer';
import EditProfileForm from './EditProfileForm';

const { Text } = Typography;

interface EditProfileModalProps {
    customerData: CustomerResponse;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ customerData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
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