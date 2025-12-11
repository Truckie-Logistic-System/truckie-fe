import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button, App } from 'antd';
import { vehicleService } from '../../../../services';
import type { VehicleAssignment } from '../../../../models';

interface AssignDriverModalProps {
    visible: boolean;
    vehicleId: string;
    onCancel: () => void;
    onSuccess: () => void;
}

const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
    visible,
    vehicleId,
    onCancel,
    onSuccess
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [isFormValid, setIsFormValid] = useState<boolean>(false);
    const { message } = App.useApp();

    // Monitor form fields to check if the form is valid
    const formValues = Form.useWatch([], form);

    useEffect(() => {
        form.validateFields({ validateOnly: true })
            .then(() => setIsFormValid(true))
            .catch(() => setIsFormValid(false));
    }, [formValues, form]);

    useEffect(() => {
        if (visible) {
            // Reset form when modal opens
            form.resetFields();

            // Fetch available drivers
            fetchDrivers();
        }
    }, [visible, form]);

    const fetchDrivers = async () => {
        try {
            // This would be replaced with an actual API call to get drivers
            // For now, using mock data
            setDrivers([
                { id: 'driver1', name: 'Nguyễn Văn A' },
                { id: 'driver2', name: 'Trần Văn B' },
                { id: 'driver3', name: 'Lê Thị C' },
            ]);
        } catch (error) {
            console.error('Error fetching drivers:', error);
            message.error('Không thể tải danh sách tài xế');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            // This would be replaced with an actual API call to assign drivers
            // For example:
            // await vehicleService.assignDrivers(vehicleId, values);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            message.success('Phân công tài xế thành công');
            onSuccess();
        } catch (error) {
            console.error('Error assigning drivers:', error);
            message.error('Không thể phân công tài xế');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Phân công tài xế"
            open={visible}
            onCancel={onCancel}
            footer={null}
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="driver_id_1"
                    label="Tài xế 1"
                    rules={[{ required: true, message: 'Vui lòng chọn tài xế 1' }]}
                >
                    <Select placeholder="Chọn tài xế 1">
                        {drivers.map(driver => (
                            <Select.Option key={driver.id} value={driver.id}>
                                {driver.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="driver_id_2"
                    label="Tài xế 2 (không bắt buộc)"
                >
                    <Select placeholder="Chọn tài xế 2" allowClear>
                        {drivers.map(driver => (
                            <Select.Option key={driver.id} value={driver.id}>
                                {driver.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả"
                >
                    <Input.TextArea rows={4} placeholder="Nhập mô tả về phân công này" />
                </Form.Item>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        disabled={!isFormValid}
                    >
                        Phân công
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default AssignDriverModal; 