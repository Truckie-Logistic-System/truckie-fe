import React, { useState, useEffect } from 'react';
import { Form, Input, Button } from 'antd';
import type { VehicleType } from '../../../../models';
import type { CreateVehicleTypeRequest, UpdateVehicleTypeRequest } from '../../../../services/vehicle/types';

interface VehicleTypeFormProps {
    mode: 'create' | 'edit';
    initialValues?: VehicleType;
    onSubmit: (values: CreateVehicleTypeRequest | UpdateVehicleTypeRequest) => void;
    onCancel: () => void;
}

const VehicleTypeForm: React.FC<VehicleTypeFormProps> = ({
    mode,
    initialValues,
    onSubmit,
    onCancel
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (initialValues && mode === 'edit') {
            form.setFieldsValue({
                ...initialValues
            });
        }
    }, [form, initialValues, mode]);

    const handleSubmit = async (values: CreateVehicleTypeRequest | UpdateVehicleTypeRequest) => {
        try {
            setLoading(true);
            await onSubmit(values);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
        >
            <Form.Item
                name="vehicleTypeName"
                label="Tên loại phương tiện"
                rules={[{ required: true, message: 'Vui lòng nhập tên loại phương tiện' }]}
            >
                <Input placeholder="Ví dụ: Xe tải nhỏ" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Mô tả"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
            >
                <Input.TextArea rows={4} placeholder="Mô tả chi tiết về loại phương tiện" />
            </Form.Item>

            <div className="flex justify-end gap-2 mt-4">
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                    {mode === 'create' ? 'Thêm loại phương tiện' : 'Cập nhật loại phương tiện'}
                </Button>
            </div>
        </Form>
    );
};

export default VehicleTypeForm; 