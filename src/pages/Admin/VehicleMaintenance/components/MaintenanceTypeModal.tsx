import React, { useEffect } from 'react';
import { Modal, Form, Input, App } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { MaintenanceTypeEntity, MaintenanceTypeRequest } from '../../../../models';
import { maintenanceTypeService } from '../../../../services/maintenance-type';

interface MaintenanceTypeModalProps {
    open: boolean;
    onCancel: () => void;
    maintenanceType: MaintenanceTypeEntity | null;
}

const MaintenanceTypeModal: React.FC<MaintenanceTypeModalProps> = ({
    open,
    onCancel,
    maintenanceType,
}) => {
    const [form] = Form.useForm<MaintenanceTypeRequest>();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const isEditing = !!maintenanceType;

    // Reset form when modal opens or maintenanceType changes
    useEffect(() => {
        if (open) {
            if (maintenanceType) {
                form.setFieldsValue({
                    maintenanceTypeName: maintenanceType.maintenanceTypeName,
                    description: maintenanceType.description,
                    // Giữ nguyên trạng thái hiện tại khi chỉnh sửa
                    isActive: maintenanceType.isActive,
                });
            } else {
                form.resetFields();
                // Set default values for new maintenance type
                form.setFieldsValue({
                    isActive: true,
                    description: '',
                });
            }
        }
    }, [open, maintenanceType, form]);

    const createMutation = useMutation({
        mutationFn: (data: MaintenanceTypeRequest) => maintenanceTypeService.createMaintenanceType(data),
        onSuccess: () => {
            message.success('Loại bảo dưỡng đã được tạo thành công');
            queryClient.invalidateQueries({ queryKey: ['maintenanceTypes'] });
            handleCancel();
        },
        onError: (error: any) => {
            message.error(error.message || 'Không thể tạo loại bảo dưỡng');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: MaintenanceTypeRequest }) =>
            maintenanceTypeService.updateMaintenanceType(id, data),
        onSuccess: () => {
            message.success('Loại bảo dưỡng đã được cập nhật thành công');
            queryClient.invalidateQueries({ queryKey: ['maintenanceTypes'] });
            handleCancel();
        },
        onError: (error: any) => {
            message.error(error.message || 'Không thể cập nhật loại bảo dưỡng');
        },
    });

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Ensure isActive is set to true for new maintenance types
            if (!isEditing) {
                values.isActive = true; // Luôn mặc định là true khi tạo mới
            } else if (maintenanceType) {
                // Giữ nguyên trạng thái hiện tại khi chỉnh sửa
                values.isActive = maintenanceType.isActive;
            }

            if (isEditing && maintenanceType) {
                updateMutation.mutate({ id: maintenanceType.id, data: values });
            } else {
                createMutation.mutate(values);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal
            title={isEditing ? 'Cập nhật loại bảo dưỡng' : 'Thêm loại bảo dưỡng mới'}
            open={open}
            onOk={handleSubmit}
            onCancel={handleCancel}
            okText={isEditing ? 'Cập nhật' : 'Thêm mới'}
            cancelText="Hủy"
            confirmLoading={isPending}
            maskClosable={!isPending}
            closable={!isPending}
        >
            <Form
                form={form}
                layout="vertical"
                disabled={isPending}
                initialValues={{ isActive: true }} // Set default value for isActive
            >
                <Form.Item
                    name="maintenanceTypeName"
                    label="Tên loại bảo dưỡng"
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên loại bảo dưỡng' },
                        { max: 100, message: 'Tên không được vượt quá 100 ký tự' }
                    ]}
                >
                    <Input placeholder="Nhập tên loại bảo dưỡng" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[
                        { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' }
                    ]}
                >
                    <Input.TextArea
                        placeholder="Nhập mô tả cho loại bảo dưỡng"
                        rows={4}
                    />
                </Form.Item>

                {/* Đã loại bỏ trường isActive */}
            </Form>
        </Modal>
    );
};

export default MaintenanceTypeModal; 