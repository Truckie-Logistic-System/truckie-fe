import React, { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, InputNumber, Select, Spin, Skeleton, Radio, Card, Descriptions, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { VehicleServiceRecord, Vehicle } from '../../../../models';
import { maintenanceTypeService } from '../../../../services/maintenance-type';
import { VehicleStatusTag } from '../../../../components/common';
import dayjs from 'dayjs';

interface MaintenanceFormProps {
    initialValues?: VehicleServiceRecord | null;
    onSubmit: (values: any) => void;
    onCancel: () => void;
    vehicles: Vehicle[];
    formId?: string;
    isLoading?: boolean;
    // Cho phép ép mode tạo mới ngay cả khi có initialValues (ví dụ: prefill từ banner)
    isEditMode?: boolean;
    // Pre-selected service type for auto-selection
    preSelectedServiceType?: string;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    vehicles,
    formId = 'maintenance-form',
    isLoading = false,
    isEditMode,
    preSelectedServiceType,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    // Fetch maintenance types - API trả về response với data là mảng
    const { data: maintenanceTypesResponse, isLoading: isLoadingMaintenanceTypes } = useQuery({
        queryKey: ['maintenanceTypes'],
        queryFn: maintenanceTypeService.getMaintenanceTypes,
    });

    // Extract service types from response
    const maintenanceTypes = maintenanceTypesResponse?.data || [];

    // Xác định mode chỉnh sửa hay tạo mới
    const effectiveIsEditMode = isEditMode ?? !!initialValues;

    // Update selected vehicle when form values change
    const vehicleId = Form.useWatch('vehicleId', form);
    const serviceType = Form.useWatch('serviceType', form);
    
    useEffect(() => {
        if (vehicleId && !effectiveIsEditMode) {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            setSelectedVehicle(vehicle || null);
        } else {
            setSelectedVehicle(null);
        }
    }, [vehicleId, vehicles, initialValues]);
    
    // Auto-fill logic based on service type and vehicle
    useEffect(() => {
        if (!effectiveIsEditMode && selectedVehicle && serviceType) {
            const formValues = form.getFieldsValue();
            
            // Auto-fill for insurance renewal
            if (serviceType === 'Gia hạn bảo hiểm' || serviceType === 'INSURANCE_RENEWAL') {
                if (selectedVehicle.insuranceExpiryDate) {
                    form.setFieldValue('plannedDate', dayjs(selectedVehicle.insuranceExpiryDate));
                }
                if (selectedVehicle.insurancePolicyNumber) {
                    form.setFieldValue('insurancePolicyNumber', selectedVehicle.insurancePolicyNumber);
                }
                // Clear next service date for insurance
                form.setFieldValue('nextServiceDate', null);
            }
            
            // Auto-fill for inspection
            if (serviceType === 'Đăng kiểm định kỳ' || serviceType === 'INSPECTION') {
                if (selectedVehicle.inspectionExpiryDate) {
                    form.setFieldValue('nextServiceDate', dayjs(selectedVehicle.inspectionExpiryDate));
                }
                // Clear insurance policy number for non-insurance
                form.setFieldValue('insurancePolicyNumber', '');
            }
            
            // Auto-fill for maintenance
            if (serviceType === 'Bảo dưỡng định kỳ' || serviceType === 'MAINTENANCE_PERIODIC') {
                if (selectedVehicle.nextMaintenanceDate) {
                    form.setFieldValue('nextServiceDate', dayjs(selectedVehicle.nextMaintenanceDate));
                }
                // Clear insurance policy number for non-insurance
                form.setFieldValue('insurancePolicyNumber', '');
            }
            
            // For repair and other, clear both optional fields
            if (serviceType === 'Sửa chữa' || serviceType === 'MAINTENANCE_REPAIR' || 
                serviceType === 'Khác' || serviceType === 'OTHER') {
                form.setFieldValue('nextServiceDate', null);
                form.setFieldValue('insurancePolicyNumber', '');
            }
        }
    }, [selectedVehicle, serviceType, effectiveIsEditMode, form]);

    // Transform initialValues if it's a VehicleServiceRecord
    const transformedInitialValues = initialValues ? (() => {
        console.log('🔍 DEBUG MaintenanceForm transformedInitialValues INPUT:', {
            initialValues,
            preSelectedServiceType
        });
        
        const result: any = {
            // Extract vehicleId from vehicleEntity OR use direct vehicleId (for banner pre-fill)
            vehicleId: (initialValues as any).vehicleId || initialValues.vehicleEntity?.id,
            // serviceType is already a string in the new model
            serviceType: preSelectedServiceType || initialValues.serviceType,
            odometerReading: initialValues.odometerReading || 0,
        };
        
        // Only include id if it exists and is not undefined (for edit mode)
        if (initialValues.id && initialValues.id !== 'undefined') {
            result.id = initialValues.id;
        }
        
        // Include other fields if they exist
        if (initialValues.plannedDate) result.plannedDate = initialValues.plannedDate;
        if (initialValues.actualDate) result.actualDate = initialValues.actualDate;
        if (initialValues.nextServiceDate) result.nextServiceDate = initialValues.nextServiceDate;
        if (initialValues.description) result.description = initialValues.description;
        if (initialValues.serviceStatus) result.serviceStatus = initialValues.serviceStatus;
        
        console.log('🔍 DEBUG MaintenanceForm transformedInitialValues OUTPUT:', result);
        
        return result;
    })() : null;

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            // Nếu chọn "Khác" thì dùng nội dung người dùng nhập làm loại dịch vụ
            if (values.serviceType === 'Khác' && values.customServiceType) {
                values.serviceType = values.customServiceType.trim();
            }
            delete values.customServiceType;

            // Always set status to PLANNED when creating new record
            if (!effectiveIsEditMode) {
                values.serviceStatus = 'PLANNED';
                // Remove id field when creating new record to avoid "undefined" UUID error
                delete values.id;
            }

            await onSubmit(values);
        } finally {
            setLoading(false);
        }
    };

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
                        plannedDate: transformedInitialValues.plannedDate ? dayjs(transformedInitialValues.plannedDate) : undefined,
                        actualDate: transformedInitialValues.actualDate ? dayjs(transformedInitialValues.actualDate) : undefined,
                        nextServiceDate: transformedInitialValues.nextServiceDate ? dayjs(transformedInitialValues.nextServiceDate) : undefined
                    }
                    : {
                        plannedDate: dayjs(),
                        serviceStatus: 'PLANNED',
                        serviceType: preSelectedServiceType || undefined
                    }
            }
            disabled={loading || effectiveIsEditMode}
            className="w-full"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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

                    {/* Show vehicle details when creating new record */}
                    {!effectiveIsEditMode && selectedVehicle && (
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="font-medium">Biển số:</span> {selectedVehicle.licensePlateNumber}</div>
                                <div><span className="font-medium">Model:</span> {selectedVehicle.model}</div>
                                <div><span className="font-medium">Hãng sản xuất:</span> {selectedVehicle.manufacturer}</div>
                                <div><span className="font-medium">Năm sản xuất:</span> {selectedVehicle.year}</div>
                                <div><span className="font-medium">Loại xe:</span> {selectedVehicle.vehicleTypeDescription || 'N/A'}</div>
                                <div><span className="font-medium">Trạng thái:</span>
                                    <VehicleStatusTag status={selectedVehicle.status} size="small" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Form.Item
                    name="serviceType"
                    label="Loại dịch vụ"
                    rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
                >
                    <Radio.Group className="flex flex-col gap-2">
                        {maintenanceTypes.map(type => (
                            <Radio key={type} value={type}>
                                {type}
                            </Radio>
                        ))}
                    </Radio.Group>
                </Form.Item>

                {form.getFieldValue('serviceType') === 'Khác' && (
                    <Form.Item
                        name="customServiceType"
                        label="Loại dịch vụ khác"
                        rules={[{ required: true, message: 'Vui lòng nhập loại dịch vụ' }]}
                        className="col-span-1 md:col-span-2"
                    >
                        <Input placeholder="Nhập loại dịch vụ khác" />
                    </Form.Item>
                )}

                <Form.Item
                    name="plannedDate"
                    label="Ngày dự kiến"
                    rules={[
                        { required: true, message: 'Vui lòng chọn ngày dự kiến' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const nextServiceDate = getFieldValue('nextServiceDate');
                                if (value && nextServiceDate && value.isAfter(nextServiceDate)) {
                                    return Promise.reject(new Error('Ngày dự kiến phải trước ngày bảo trì tiếp theo'));
                                }
                                return Promise.resolve();
                            },
                        }),
                    ]}
                    dependencies={['nextServiceDate']}
                >
                    <DatePicker
                        className="w-full"
                        format="DD/MM/YYYY HH:mm"
                        placeholder="Chọn ngày dự kiến"
                        showTime
                    />
                </Form.Item>

                {/* Insurance Policy Number field - only show for insurance renewals */}
                <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.serviceType !== currentValues.serviceType}>
                    {({ getFieldValue }) => {
                        const currentServiceType = getFieldValue('serviceType');
                        return (currentServiceType === 'Gia hạn bảo hiểm' || currentServiceType === 'INSURANCE_RENEWAL') ? (
                            <Form.Item
                                name="insurancePolicyNumber"
                                label="Số bảo hiểm"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số bảo hiểm' },
                                    { max: 50, message: 'Số bảo hiểm không được quá 50 ký tự' }
                                ]}
                                className="col-span-1 md:col-span-2"
                            >
                                <Input placeholder="Nhập số bảo hiểm" />
                            </Form.Item>
                        ) : null;
                    }}
                </Form.Item>

                {/* Next Service Date - show only for inspection and maintenance */}
                <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.serviceType !== currentValues.serviceType}>
                    {({ getFieldValue }) => {
                        const currentServiceType = getFieldValue('serviceType');
                        
                        // Only show for inspection and maintenance
                        if (currentServiceType !== 'Đăng kiểm định kỳ' && currentServiceType !== 'INSPECTION' &&
                            currentServiceType !== 'Bảo dưỡng định kỳ' && currentServiceType !== 'MAINTENANCE_PERIODIC') {
                            return null;
                        }
                        
                        return (
                            <Form.Item
                                name="nextServiceDate"
                                label="Ngày bảo trì/kiểm định tiếp theo"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn ngày tiếp theo' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value) return Promise.resolve();
                                            const plannedDate = getFieldValue('plannedDate');
                                            if (plannedDate && value.isBefore(plannedDate)) {
                                                return Promise.reject(new Error('Ngày bảo trì tiếp theo phải sau ngày dự kiến'));
                                            }
                                            if (value.isBefore(dayjs())) {
                                                return Promise.reject(new Error('Ngày bảo trì tiếp theo phải sau ngày hiện tại'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                                dependencies={['plannedDate']}
                                help="Ngày dự kiến cho lần bảo trì/kiểm định tiếp theo"
                            >
                                <DatePicker
                                    className="w-full"
                                    format="DD/MM/YYYY HH:mm"
                                    placeholder="Chọn ngày tiếp theo"
                                    showTime
                                />
                            </Form.Item>
                        );
                    }}
                </Form.Item>

                {initialValues && initialValues.serviceStatus === 'COMPLETED' && (
                    <Form.Item
                        name="actualDate"
                        label="Ngày thực tế"
                        className="col-span-1 md:col-span-2"
                    >
                        <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY HH:mm"
                            placeholder="Chọn ngày thực tế"
                            showTime
                            disabled
                        />
                    </Form.Item>
                )}

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
                    name="description"
                    label="Mô tả"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                >
                    <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết" />
                </Form.Item>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                    {initialValues ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </div>
        </Form>
    );
};

export default MaintenanceForm;
