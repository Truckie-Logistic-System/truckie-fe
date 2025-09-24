import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Button } from 'antd';
import dayjs from 'dayjs';
import { vehicleService } from '../../../../services';
import { App } from 'antd';

interface ScheduleMaintenanceModalProps {
    visible: boolean;
    vehicleId: string;
    onCancel: () => void;
    onSuccess?: () => void;
}

const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({
    visible,
    vehicleId,
    onCancel,
    onSuccess
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            const maintenanceData = {
                ...values,
                vehicleId,
                maintenanceDate: values.maintenanceDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                nextMaintenanceDate: values.nextMaintenanceDate ? values.nextMaintenanceDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ') : undefined,
                maintenanceTypeId: "1" // Giả sử có một loại bảo trì mặc định
            };

            const response = await vehicleService.createVehicleMaintenance(maintenanceData);

            if (response.success) {
                message.success('Đặt lịch bảo trì thành công');
                form.resetFields();
                onCancel();
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                message.warning(response.message || 'Không thể đặt lịch bảo trì');
            }
        } catch (error) {
            console.error('Error scheduling maintenance:', error);
            message.error('Có lỗi xảy ra khi đặt lịch bảo trì');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Đặt lịch bảo trì"
            open={visible}
            onCancel={onCancel}
            footer={null}
            maskClosable={false}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    maintenanceDate: dayjs(),
                    cost: 0
                }}
                preserve={false}
            >
                <Form.Item
                    name="maintenanceDate"
                    label="Ngày bảo trì"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày bảo trì' }]}
                >
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả công việc bảo trì"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả công việc bảo trì' }]}
                >
                    <Input.TextArea rows={3} placeholder="Nhập mô tả chi tiết về công việc bảo trì" />
                </Form.Item>

                <Form.Item
                    name="serviceCenter"
                    label="Trung tâm dịch vụ"
                    rules={[{ required: true, message: 'Vui lòng nhập tên trung tâm dịch vụ' }]}
                >
                    <Input placeholder="Nhập tên trung tâm dịch vụ" />
                </Form.Item>

                <Form.Item
                    name="cost"
                    label="Chi phí (VND)"
                    rules={[{ required: true, message: 'Vui lòng nhập chi phí' }]}
                >
                    <InputNumber
                        className="w-full"
                        min={0}
                        addonAfter="VND"
                    />
                </Form.Item>

                <Form.Item
                    name="odometerReading"
                    label="Số công-tơ-mét (km)"
                >
                    <InputNumber
                        className="w-full"
                        min={0}
                        addonAfter="km"
                    />
                </Form.Item>

                <Form.Item
                    name="nextMaintenanceDate"
                    label="Ngày bảo trì tiếp theo (dự kiến)"
                >
                    <DatePicker
                        className="w-full"
                        format="DD/MM/YYYY"
                        disabledDate={current => current && current < dayjs().endOf('day')}
                    />
                </Form.Item>

                <div className="flex justify-end gap-2">
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Đặt lịch
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ScheduleMaintenanceModal; 