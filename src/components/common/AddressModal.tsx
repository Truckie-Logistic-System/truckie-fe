import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Radio, App, Spin, Select, Alert, Button } from 'antd';
import addressService from '../../services/address/addressService';
import type { Address, AddressCreateDto, AddressUpdateDto } from '../../models/Address';
import useProvinces from '../../hooks/useProvinces';

interface AddressModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    initialValues: Address | null;
    mode: 'create' | 'edit';
    showAddressType?: boolean;
    defaultAddressType?: boolean;
    title?: string;
}

// Hàm so sánh tiếng Việt không dấu để cải thiện tìm kiếm
const removeVietnameseAccents = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
};

const AddressModal: React.FC<AddressModalProps> = ({
    visible,
    onCancel,
    onSuccess,
    initialValues,
    mode,
    showAddressType = true,
    defaultAddressType,
    title
}) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [useManualInput, setUseManualInput] = useState(false);
    const { message } = App.useApp();

    // Use custom hook for provinces data
    const {
        provinces,
        isLoading: isLoadingProvinces,
        error: provincesError,
        isError: isProvincesError,
        invalidateAndRefetch,
        selectedProvince,
        wards,
        findWard,
        isValidData
    } = useProvinces(visible);

    console.log('AddressModal render:', {
        visible,
        provinces: provinces?.length,
        wards: wards?.length,
        isLoadingProvinces,
        isProvincesError,
        isValidData,
        selectedProvince: selectedProvince?.name
    });

    // Nếu dữ liệu không hợp lệ hoặc không có wards, chuyển sang nhập thủ công
    useEffect(() => {
        if (visible && !isLoadingProvinces && (!isValidData || wards.length === 0)) {
            console.log('Data is invalid or no wards available, switching to manual input');
            setUseManualInput(true);
        }
    }, [visible, isLoadingProvinces, isValidData, wards]);

    // Reset form when modal opens or closes
    useEffect(() => {
        if (visible) {
            console.log('Modal is visible, resetting form');
            form.resetFields();

            // Chỉ reset useManualInput khi có dữ liệu hợp lệ
            if (isValidData && wards.length > 0) {
                setUseManualInput(false);
            }

            if (initialValues && mode === 'edit') {
                console.log('Setting initial values for edit mode:', initialValues);
                form.setFieldsValue({
                    street: initialValues.street,
                    ward: initialValues.ward,
                    province: initialValues.province,
                    addressType: initialValues.addressType
                });

                // If editing and we have wards, try to find the matching ward
                if (wards.length > 0) {
                    const wardName = initialValues.ward;
                    const matchingWard = findWard(wardName);

                    if (matchingWard) {
                        console.log(`Found matching ward for "${wardName}":`, matchingWard);
                        form.setFieldsValue({ ward: matchingWard.code });
                    } else {
                        console.log(`Ward "${wardName}" not found in the list, switching to manual input`);
                        setUseManualInput(true);
                        form.setFieldsValue({ ward: wardName });
                    }
                }
            } else if (defaultAddressType !== undefined) {
                form.setFieldsValue({
                    addressType: defaultAddressType
                });
            }

            // Set province field
            if (selectedProvince) {
                form.setFieldsValue({ province: selectedProvince.name });
            } else {
                form.setFieldsValue({ province: 'Thành phố Hồ Chí Minh' });
            }
        }
    }, [visible, initialValues, form, mode, defaultAddressType, wards, selectedProvince, findWard, isValidData]);

    // Handle form submission
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // If using select boxes, get the ward name from the selected ward code
            let wardName = values.ward;
            if (!useManualInput && typeof values.ward === 'number') {
                const selectedWard = wards.find(ward => ward.code === values.ward);
                if (selectedWard) {
                    wardName = selectedWard.name;
                }
            }

            // Prepare address data with required fields
            const addressData = {
                street: values.street,
                ward: wardName,
                province: selectedProvince?.name || values.province || 'Thành phố Hồ Chí Minh',
                addressType: values.addressType
            };

            console.log('Submitting address data:', addressData);

            if (mode === 'create') {
                await addressService.createAddress(addressData as AddressCreateDto);
                message.success('Thêm địa chỉ thành công');
            } else if (mode === 'edit' && initialValues) {
                await addressService.updateAddress(initialValues.id, addressData as AddressUpdateDto);
                message.success('Cập nhật địa chỉ thành công');
            }

            onSuccess();
        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage = mode === 'create'
                ? 'Không thể thêm địa chỉ'
                : 'Không thể cập nhật địa chỉ';
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Switch to manual input mode
    const switchToManualInput = () => {
        setUseManualInput(true);
        const currentWard = form.getFieldValue('ward');
        let wardValue = '';

        // If current ward is a number (code), find the name
        if (typeof currentWard === 'number') {
            const selectedWard = wards.find(ward => ward.code === currentWard);
            if (selectedWard) {
                wardValue = selectedWard.name;
            }
        } else if (typeof currentWard === 'string') {
            wardValue = currentWard;
        }

        form.setFieldsValue({
            ward: wardValue,
            province: selectedProvince?.name || 'Thành phố Hồ Chí Minh'
        });
    };

    // Switch back to dropdown mode
    const switchToDropdownMode = () => {
        // Chỉ cho phép chuyển sang dropdown khi có dữ liệu hợp lệ và có wards
        if (isValidData && wards.length > 0) {
            setUseManualInput(false);
            form.setFieldsValue({
                ward: undefined
            });
        } else {
            message.warning('Không thể chuyển sang chế độ dropdown do dữ liệu không hợp lệ');
        }
    };

    // Tùy chỉnh hàm lọc cho Select để cải thiện tìm kiếm
    const customFilterOption = (input: string, option: any) => {
        const optionLabel = option?.label?.toString() || '';
        const inputValue = input.toLowerCase();
        const optionLabelLower = optionLabel.toLowerCase();

        // Kiểm tra nếu label chứa input trực tiếp
        if (optionLabelLower.includes(inputValue)) {
            return true;
        }

        // Kiểm tra không dấu
        const optionLabelNormalized = removeVietnameseAccents(optionLabel);
        const inputValueNormalized = removeVietnameseAccents(input);

        // Tách từ khóa tìm kiếm và kiểm tra từng phần
        const inputParts = inputValueNormalized.split(/\s+/).filter(Boolean);

        // Nếu tất cả các phần của input đều có trong option (không phân biệt thứ tự)
        return inputParts.every(part => optionLabelNormalized.includes(part));
    };

    const modalTitle = title || (mode === 'create' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ');

    // Hiển thị thông tin debug khi có lỗi
    const renderDebugInfo = () => {
        if (!isProvincesError && isValidData) return null;

        return (
            <div className="text-xs text-gray-500 mt-1 mb-2">
                <div>Provinces: {provinces?.length || 0}</div>
                <div>Wards: {wards?.length || 0}</div>
                <div>Selected province: {selectedProvince?.name || 'None'}</div>
                <div>Valid data: {isValidData ? 'Yes' : 'No'}</div>
            </div>
        );
    };

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText={mode === 'create' ? 'Thêm' : 'Cập nhật'}
            cancelText="Hủy"
            confirmLoading={submitting}
            maskClosable={false}
        >
            <Spin spinning={isLoadingProvinces || submitting}>
                {isProvincesError && (
                    <Alert
                        message={`Không thể tải danh sách tỉnh/thành phố: ${provincesError?.toString()}`}
                        type="warning"
                        showIcon
                        className="mb-4"
                        action={
                            <Button size="small" onClick={invalidateAndRefetch}>
                                Thử lại
                            </Button>
                        }
                    />
                )}

                {!isProvincesError && !isValidData && !isLoadingProvinces && (
                    <Alert
                        message="Dữ liệu tỉnh/thành phố không hợp lệ. Đang sử dụng chế độ nhập thủ công."
                        type="warning"
                        showIcon
                        className="mb-4"
                        action={
                            <Button size="small" onClick={invalidateAndRefetch}>
                                Thử lại
                            </Button>
                        }
                    />
                )}

                {renderDebugInfo()}

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ addressType: defaultAddressType !== undefined ? defaultAddressType : true }}
                >
                    <Form.Item
                        name="street"
                        label="Đường/Số nhà"
                        rules={[{ required: true, message: 'Vui lòng nhập đường/số nhà' }]}
                    >
                        <Input placeholder="Nhập đường và số nhà" />
                    </Form.Item>

                    {!useManualInput && isValidData && wards.length > 0 ? (
                        <>
                            <Form.Item
                                name="ward"
                                label="Phường/Xã"
                                rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                            // extra={
                            //     <a onClick={switchToManualInput} className="text-blue-500 text-sm">
                            //         Nhập thủ công
                            //     </a>
                            // }
                            >
                                <Select
                                    placeholder="Chọn phường/xã"
                                    showSearch
                                    optionFilterProp="label"
                                    filterOption={customFilterOption}
                                    options={wards.map(ward => ({
                                        value: ward.code,
                                        label: ward.name
                                    }))}
                                />
                            </Form.Item>

                            <Form.Item
                                name="province"
                                label="Tỉnh/Thành phố"
                                initialValue={selectedProvince?.name || 'Thành phố Hồ Chí Minh'}
                            >
                                <Input disabled value={selectedProvince?.name || 'Thành phố Hồ Chí Minh'} />
                            </Form.Item>
                        </>
                    ) : (
                        <>
                            <Form.Item
                                name="ward"
                                label="Phường/Xã"
                                rules={[{ required: true, message: 'Vui lòng nhập phường/xã' }]}
                                extra={
                                    isValidData && wards.length > 0 ? (
                                        <a onClick={switchToDropdownMode} className="text-blue-500 text-sm">
                                            Chọn từ danh sách
                                        </a>
                                    ) : null
                                }
                            >
                                <Input placeholder="Nhập phường/xã" />
                            </Form.Item>

                            <Form.Item
                                name="province"
                                label="Tỉnh/Thành phố"
                                initialValue="Thành phố Hồ Chí Minh"
                                rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
                            >
                                <Input
                                    placeholder="Nhập tỉnh/thành phố"
                                    disabled
                                    value="Thành phố Hồ Chí Minh"
                                />
                            </Form.Item>
                        </>
                    )}

                    {showAddressType && (
                        <Form.Item
                            name="addressType"
                            label="Loại địa chỉ"
                            rules={[{ required: true, message: 'Vui lòng chọn loại địa chỉ' }]}
                        >
                            <Radio.Group>
                                <Radio value={true}>Địa chỉ gửi hàng</Radio>
                                <Radio value={false}>Địa chỉ nhận hàng</Radio>
                            </Radio.Group>
                        </Form.Item>
                    )}
                </Form>
            </Spin>
        </Modal>
    );
};

export default AddressModal; 