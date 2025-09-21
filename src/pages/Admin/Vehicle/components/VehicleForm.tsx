import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, Radio } from 'antd';
import { vehicleService } from '../../../../services';
import type { Vehicle, VehicleType, CreateVehicleRequest, UpdateVehicleRequest } from '../../../../models';

interface VehicleFormProps {
    mode: 'create' | 'edit';
    initialValues?: Vehicle;
    onSubmit: (values: CreateVehicleRequest | UpdateVehicleRequest) => void;
    onCancel: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
    mode,
    initialValues,
    onSubmit,
    onCancel
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [loadingTypes, setLoadingTypes] = useState<boolean>(true);

    useEffect(() => {
        const fetchVehicleTypes = async () => {
            try {
                setLoadingTypes(true);
                const response = await vehicleService.getVehicleTypes();
                if (response.success) {
                    setVehicleTypes(response.data || []);
                } else {
                    // Không phải lỗi, chỉ là không có dữ liệu
                    setVehicleTypes([]);
                }
            } catch (error) {
                console.error('Error fetching vehicle types:', error);
                setVehicleTypes([]);
            } finally {
                setLoadingTypes(false);
            }
        };

        fetchVehicleTypes();
    }, []);

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            await onSubmit(values);
            form.resetFields();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
        >
            <Form.Item
                name="licensePlateNumber"
                label="Biển số xe"
                rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
            >
                <Input placeholder="Nhập biển số xe" />
            </Form.Item>

            <Form.Item
                name="model"
                label="Mẫu xe"
                rules={[{ required: true, message: 'Vui lòng nhập mẫu xe' }]}
            >
                <Input placeholder="Nhập mẫu xe" />
            </Form.Item>

            <Form.Item
                name="manufacturer"
                label="Nhà sản xuất"
                rules={[{ required: true, message: 'Vui lòng nhập nhà sản xuất' }]}
            >
                <Input placeholder="Nhập nhà sản xuất" />
            </Form.Item>

            <Form.Item
                name="year"
                label="Năm sản xuất"
                rules={[{ required: true, message: 'Vui lòng nhập năm sản xuất' }]}
            >
                <InputNumber
                    className="w-full"
                    placeholder="Nhập năm sản xuất"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                />
            </Form.Item>

            <Form.Item
                name="capacity"
                label="Sức chứa (kg)"
                rules={[{ required: true, message: 'Vui lòng nhập sức chứa' }]}
            >
                <InputNumber
                    className="w-full"
                    placeholder="Nhập sức chứa"
                    min={0}
                    addonAfter="kg"
                />
            </Form.Item>

            <Form.Item
                name="vehicleTypeId"
                label="Loại phương tiện"
                rules={[{ required: true, message: 'Vui lòng chọn loại phương tiện' }]}
            >
                <Select
                    placeholder="Chọn loại phương tiện"
                    loading={loadingTypes}
                    notFoundContent="Không có loại phương tiện nào"
                >
                    {vehicleTypes.map(type => (
                        <Select.Option key={type.id} value={type.id}>
                            {type.vehicleTypeName}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                initialValue="active"
            >
                <Radio.Group>
                    <Radio value="active">Hoạt động</Radio>
                    <Radio value="inactive">Không hoạt động</Radio>
                </Radio.Group>
            </Form.Item>

            <div className="flex justify-end gap-2 mt-4">
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                    {mode === 'create' ? 'Thêm mới' : 'Cập nhật'}
                </Button>
            </div>
        </Form>
    );
};

export default VehicleForm; 