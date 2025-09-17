import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, InputNumber, Select, Spin, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { VehicleMaintenance, Vehicle, VehicleMaintenanceDetail } from '../../../../models';
import { maintenanceTypeService } from '../../../../services/maintenance-type';
import dayjs from 'dayjs';

interface MaintenanceFormProps {
    initialValues?: VehicleMaintenance | VehicleMaintenanceDetail | null;
    onSubmit: (values: any) => void;
    onCancel: () => void;
    vehicles: Vehicle[];
    formId?: string;
    isLoading?: boolean;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    vehicles,
    formId = 'maintenance-form',
    isLoading = false
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch maintenance types - API trả về response với data là mảng
    const { data: maintenanceTypesResponse, isLoading: isLoadingMaintenanceTypes } = useQuery({
        queryKey: ['maintenanceTypes'],
        queryFn: maintenanceTypeService.getMaintenanceTypes,
    });

    // Transform initialValues if it's a VehicleMaintenanceDetail
    const transformedInitialValues = initialValues ? {
        ...initialValues,
        // If it's a VehicleMaintenanceDetail, extract IDs from nested objects
        vehicleId: 'vehicleEntity' in initialValues ? initialValues.vehicleEntity?.id : initialValues.vehicleId,
        maintenanceTypeId: 'maintenanceTypeEntity' in initialValues ? initialValues.maintenanceTypeEntity?.id : initialValues.maintenanceTypeId,
    } : null;

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            await onSubmit(values);
        } finally {
            setLoading(false);
        }
    };

    // Extract maintenance types from response
    const maintenanceTypes = maintenanceTypesResponse?.data || [];

    if (isLoading || isLoadingMaintenanceTypes) {
        return (
            <div className="space-y-4">
                <Skeleton.Input active block style={{ height: 40 }} />
                <Skeleton active paragraph={{ rows: 2 }} />
                <Skeleton.Input active block style={{ height: 40 }} />
                <Skeleton active paragraph={{ rows: 2 }} />
                <Skeleton.Input active block style={{ height: 40 }} />
                <Skeleton active paragraph={{ rows: 2 }} />
            </div>
        );
    }

    return (
        <Form
            id={formId}
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={
                transformedInitialValues
                    ? {
                        ...transformedInitialValues,
                        maintenanceDate: transformedInitialValues.maintenanceDate ? dayjs(transformedInitialValues.maintenanceDate) : undefined,
                        nextMaintenanceDate: transformedInitialValues.nextMaintenanceDate ? dayjs(transformedInitialValues.nextMaintenanceDate) : undefined
                    }
                    : {
                        maintenanceDate: dayjs(),
                        cost: 0
                    }
            }
            disabled={loading}
            className="max-w-4xl mx-auto"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                    name="vehicleId"
                    label="Phương tiện"
                    rules={[{ required: true, message: 'Vui lòng chọn phương tiện' }]}
                >
                    <Select
                        placeholder="Chọn phương tiện"
                        showSearch
                        optionFilterProp="children"
                        loading={isLoading}
                        filterOption={(input, option) => {
                            const childrenText = option?.children?.toString() || '';
                            return childrenText.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                        }}
                    >
                        {vehicles.map(vehicle => (
                            <Select.Option key={vehicle.id} value={vehicle.id}>
                                {vehicle.licensePlateNumber} - {vehicle.model}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="maintenanceTypeId"
                    label="Loại bảo trì"
                    rules={[{ required: true, message: 'Vui lòng chọn loại bảo trì' }]}
                >
                    <Select
                        placeholder="Chọn loại bảo trì"
                        loading={isLoadingMaintenanceTypes}
                        notFoundContent={isLoadingMaintenanceTypes ? <Spin size="small" /> : 'Không có dữ liệu'}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) => {
                            const childrenText = option?.children?.toString() || '';
                            return childrenText.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                        }}
                    >
                        {maintenanceTypes.map(type => (
                            <Select.Option key={type.id} value={type.id}>
                                {type.maintenanceTypeName}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="maintenanceDate"
                    label="Ngày bảo trì"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày bảo trì' }]}
                >
                    <DatePicker
                        className="w-full"
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày bảo trì"
                    />
                </Form.Item>

                <Form.Item
                    name="nextMaintenanceDate"
                    label="Ngày bảo trì tiếp theo (dự kiến)"
                >
                    <DatePicker
                        className="w-full"
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày bảo trì tiếp theo"
                        disabledDate={current => current && current < dayjs().endOf('day')}
                    />
                </Form.Item>

                <Form.Item
                    name="cost"
                    label="Chi phí (VND)"
                    rules={[{ required: true, message: 'Vui lòng nhập chi phí' }]}
                >
                    <InputNumber
                        className="w-full"
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        placeholder="Nhập chi phí"
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
                        placeholder="Nhập số công-tơ-mét hiện tại"
                        min={0}
                        addonAfter="km"
                    />
                </Form.Item>

                <Form.Item
                    name="serviceCenter"
                    label="Trung tâm dịch vụ"
                    rules={[{ required: true, message: 'Vui lòng nhập tên trung tâm dịch vụ' }]}
                    className="col-span-1 md:col-span-2"
                >
                    <Input placeholder="Nhập tên trung tâm dịch vụ" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả công việc bảo trì"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả công việc bảo trì' }]}
                    className="col-span-1 md:col-span-2"
                >
                    <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết về công việc bảo trì" />
                </Form.Item>
            </div>

            {/* Nút này chỉ hiển thị khi không sử dụng formId từ bên ngoài */}
            {!formId && (
                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {initialValues ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </div>
            )}
        </Form>
    );
};

export default MaintenanceForm; 