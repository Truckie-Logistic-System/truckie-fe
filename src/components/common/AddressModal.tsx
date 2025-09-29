import React, { useState, useEffect } from 'react';
import { Modal, Form, App, Spin, Alert, Button, Divider, Space, Row, Col, Typography, Input, Select, Radio } from 'antd';
import addressService from '../../services/address/addressService';
import trackasiaService from '../../services/map/trackasiaService';
import type { Address, AddressCreateDto, AddressUpdateDto } from '../../models/Address';
import useProvinces from '../../hooks/useProvinces';
import type { MapLocation } from '../../models/Map';
import type { PlaceDetailResult, AutocompleteResult } from '../../models/TrackAsia';
import AddressMap from './AddressMap';
import AddressSearch from './AddressSearch';
import AddressForm from './AddressForm';
import { createCustomFilterOption, processPlaceDetail } from './AddressHelper';

// Định nghĩa interface cho window để thêm trackasia
declare global {
    interface Window {
        trackasia?: any;
        trackasiagl?: any;
    }
}

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
    const [useTrackAsia, setUseTrackAsia] = useState(true);
    const { message } = App.useApp();

    // TrackAsia states
    const [selectedPlace, setSelectedPlace] = useState<PlaceDetailResult | null>(null);
    const [mapLocation, setMapLocation] = useState<MapLocation | null>(null);

    // Use custom hook for provinces data (as fallback)
    const {
        provinces,
        isLoading: isLoadingProvinces,
        error: provincesError,
        isError: isProvincesError,
        invalidateAndRefetch,
        selectedProvince,
        wards,
        findWard,
        isValidData,
        isLoading
    } = useProvinces(visible && !useTrackAsia);

    console.log('AddressModal render:', {
        visible,
        useTrackAsia,
        selectedPlace: selectedPlace?.name,
        provinces: provinces?.length,
        wards: wards?.length,
        isLoadingProvinces,
        isProvincesError,
        isValidData,
        selectedProvince: selectedProvince?.name
    });

    // Nếu TrackAsia không hoạt động và dữ liệu không hợp lệ hoặc không có wards, chuyển sang nhập thủ công
    useEffect(() => {
        // Chỉ xử lý khi modal hiển thị và không sử dụng TrackAsia
        if (!visible || useTrackAsia) return;

        // Chỉ kiểm tra khi đã load xong provinces và không đang loading
        if (!isLoadingProvinces) {
            const shouldUseManualInput = !isValidData || wards.length === 0;

            if (shouldUseManualInput && !useManualInput) {
                console.log('Data is invalid or no wards available, switching to manual input');
                setUseManualInput(true);
            }
        }
    }, [visible, useTrackAsia, isLoadingProvinces, isValidData, wards, useManualInput]);

    // Khởi tạo bản đồ khi modal hiển thị
    useEffect(() => {
        let isMounted = true;

        // Kiểm tra TrackAsia API khi modal hiển thị và đang ở chế độ TrackAsia
        if (visible && useTrackAsia) {
            try {
                trackasiaService.autocomplete('test', 1)
                    .then((results: AutocompleteResult[]) => {
                        if (!isMounted) return;
                        if (results.length === 0) {
                            console.warn('TrackAsia API not working, switching to province API');
                            setUseTrackAsia(false);
                        } else {
                            console.log('TrackAsia API is working');
                        }
                    })
                    .catch((error: Error) => {
                        if (!isMounted) return;
                        console.error('Error testing TrackAsia API:', error);
                        setUseTrackAsia(false);
                    });
            } catch (error) {
                console.error('Error initializing TrackAsia:', error);
                setUseTrackAsia(false);
            }
        }
        return () => { isMounted = false; };
    }, [visible]);


    useEffect(() => {
        if (!visible) return;

        console.log('Modal is visible, resetting form');
        form.resetFields();
        setSelectedPlace(null);
        setMapLocation(null);

        // Đặt lại chế độ nhập liệu dựa trên trạng thái TrackAsia và dữ liệu tỉnh/thành phố
        if (useTrackAsia) {
            setUseManualInput(false);
        } else if (isValidData && wards.length > 0) {
            setUseManualInput(false);
        }

        if (initialValues && mode === 'edit') {
            console.log('Setting initial values for edit mode:', initialValues);

            // Sử dụng setTimeout để tránh Maximum update depth exceeded
            setTimeout(() => {
                form.setFieldsValue({
                    street: initialValues.street,
                    ward: initialValues.ward,
                    province: initialValues.province,
                    addressType: initialValues.addressType,
                    latitude: initialValues.latitude,
                    longitude: initialValues.longitude
                });

                if (initialValues.latitude && initialValues.longitude) {
                    const location = {
                        lat: initialValues.latitude,
                        lng: initialValues.longitude,
                        address: `${initialValues.street}, ${initialValues.ward}, ${initialValues.province}`
                    };
                    setMapLocation(location);
                }

                // Nếu không dùng TrackAsia và có dữ liệu wards, cố gắng tìm ward
                if (!useTrackAsia && wards.length > 0) {
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
            }, 0);
        } else if (defaultAddressType !== undefined) {
            form.setFieldsValue({ addressType: defaultAddressType });
        }

        // Đặt giá trị mặc định cho province nếu không dùng TrackAsia
        if (!useTrackAsia) {
            if (selectedProvince) {
                form.setFieldsValue({ province: selectedProvince.name });
            } else {
                form.setFieldsValue({ province: 'Thành phố Hồ Chí Minh' });
            }
        }
    }, [visible, initialValues, mode, defaultAddressType, useTrackAsia, selectedProvince]);

    // Handle form submission
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // If using select boxes, get the ward name from the selected ward code
            let wardName = values.ward;
            if (!useTrackAsia && !useManualInput && typeof values.ward === 'number') {
                const selectedWard = wards.find(ward => ward.code === values.ward);
                if (selectedWard) {
                    wardName = selectedWard.name;
                }
            }

            // Prepare address data with required fields
            const addressData: any = {
                street: values.street,
                ward: wardName,
                province: values.province || 'Thành phố Hồ Chí Minh',
                addressType: values.addressType
            };

            // Thêm tọa độ từ form values hoặc mapLocation
            if (values.latitude && values.longitude) {
                addressData.latitude = values.latitude;
                addressData.longitude = values.longitude;
            } else if (mapLocation) {
                addressData.latitude = mapLocation.lat;
                addressData.longitude = mapLocation.lng;
            }

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

    // Switch to TrackAsia mode
    const switchToTrackAsia = () => {
        setUseTrackAsia(true);
        setUseManualInput(false);
    };

    // Switch to Province API mode
    const switchToProvinceAPI = () => {
        setUseTrackAsia(false);
        // Chỉ gọi invalidateAndRefetch nếu cần thiết
        if (!isValidData && !isLoadingProvinces) {
            invalidateAndRefetch();
        }
    };

    // Tùy chỉnh hàm lọc cho Select để cải thiện tìm kiếm
    const customFilterOption = createCustomFilterOption();

    // Xử lý khi chọn địa điểm từ TrackAsia
    const handlePlaceSelect = (place: PlaceDetailResult) => {
        console.log('handlePlaceSelect called with place:', place);
        setSelectedPlace(place);

        // Xử lý dữ liệu từ place
        try {
            // Tìm street_number và route
            const streetNumber = place.address_components?.find(c => c.types && c.types.includes('street_number'));
            const route = place.address_components?.find(c => c.types && c.types.includes('route'));

            // Tìm ward từ administrative_area_level_2
            const ward = place.address_components?.find(c => c.types && c.types.includes('administrative_area_level_2'));

            // Tìm province từ administrative_area_level_1
            const province = place.address_components?.find(c => c.types && c.types.includes('administrative_area_level_1'));

            // Xử lý street
            let street = '';
            if (streetNumber && route) {
                // Nếu có cả street_number và route, kết hợp chúng
                street = `${streetNumber.long_name} ${route.long_name}`;
            } else {
                // Nếu không có cả street_number và route, sử dụng name
                street = place.name || '';
            }

            // Xử lý ward
            let wardName = '';
            if (ward) {
                wardName = ward.long_name;
            } else {
                // Nếu không có ward, thử lấy từ formatted_address
                const addressParts = place.formatted_address?.split(',') || [];
                if (addressParts.length > 1) {
                    wardName = addressParts[1].trim();
                }
            }

            // Xử lý province
            let provinceName = '';
            if (province) {
                provinceName = province.long_name;
                // Đảm bảo có "Thành phố" ở đầu nếu là Hồ Chí Minh
                if (provinceName.includes('Hồ Chí Minh') && !provinceName.includes('Thành phố')) {
                    provinceName = `Thành phố ${provinceName}`;
                }
            } else {
                // Nếu không có province, thử lấy từ formatted_address
                const addressParts = place.formatted_address?.split(',') || [];
                if (addressParts.length > 2) {
                    provinceName = addressParts[addressParts.length - 1].trim();
                    if (provinceName.includes('Hồ Chí Minh') && !provinceName.includes('Thành phố')) {
                        provinceName = `Thành phố ${provinceName}`;
                    }
                } else {
                    provinceName = 'Thành phố Hồ Chí Minh';
                }
            }

            // Cập nhật vị trí trên bản đồ
            if (place.geometry && place.geometry.location) {
                setMapLocation({
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                    address: place.formatted_address || place.name
                });
            }

            // Điền thông tin vào form
            const formValues = {
                street: street,
                ward: wardName,
                province: provinceName,
                latitude: place.geometry?.location.lat,
                longitude: place.geometry?.location.lng
            };

            console.log('Setting form values:', formValues);

            // Reset form trước khi set lại giá trị
            form.resetFields();

            // Sử dụng setTimeout để đảm bảo form values được cập nhật
            setTimeout(() => {
                // Set từng field riêng biệt
                Object.entries(formValues).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        form.setFields([{
                            name: key,
                            value: value,
                            touched: true
                        }]);
                        console.log(`Set field ${key} to:`, value);
                    }
                });

                console.log('Form values after setting fields:', form.getFieldsValue());
            }, 0);

            // Log để debug
            console.log('Form values after place selection:', form.getFieldsValue());
        } catch (error) {
            console.error('Error processing place details:', error);

            // Fallback: Sử dụng thông tin cơ bản từ place
            if (place.geometry && place.geometry.location) {
                setMapLocation({
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                    address: place.formatted_address || place.name
                });

                // Cố gắng lấy thông tin từ formatted_address, vicinity hoặc name
                let streetValue = place.name || '';
                let wardValue = '';
                let provinceValue = 'Thành phố Hồ Chí Minh';

                if (place.formatted_address) {
                    const addressParts = place.formatted_address.split(',').map(part => part.trim());

                    if (addressParts.length > 1) {
                        wardValue = addressParts[1];
                    }

                    if (addressParts.length > 2) {
                        provinceValue = addressParts[addressParts.length - 1];
                        if (provinceValue.includes('Hồ Chí Minh') && !provinceValue.includes('Thành phố')) {
                            provinceValue = `Thành phố ${provinceValue}`;
                        }
                    }
                }

                const formValues = {
                    street: streetValue,
                    ward: wardValue,
                    province: provinceValue,
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng
                };

                console.log('Setting fallback form values:', formValues);

                // Reset form trước khi set lại giá trị
                form.resetFields();

                // Sử dụng setTimeout để đảm bảo form values được cập nhật
                setTimeout(() => {
                    // Set từng field riêng biệt
                    Object.entries(formValues).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            form.setFields([{
                                name: key,
                                value: value,
                                touched: true
                            }]);
                            console.log(`Set field ${key} to:`, value);
                        }
                    });

                    console.log('Fallback form values after setting fields:', form.getFieldsValue());
                }, 0);

                console.log('Fallback form values after place selection:', form.getFieldsValue());
            }
        }
    };

    // Xử lý khi vị trí trên bản đồ thay đổi
    const handleLocationChange = (location: MapLocation) => {
        setMapLocation(location);
    };

    // Xử lý khi modal đóng
    const handleCancel = () => {
        // Clear form và reset state
        form.resetFields();
        setSelectedPlace(null);
        setMapLocation(null);
        onCancel();
    };

    const modalTitle = title || (mode === 'create' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ');

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <span className="text-lg font-medium">{modalTitle}</span>
                    {useTrackAsia && <span className="ml-2 text-sm text-gray-500">(Có thể chọn trên bản đồ)</span>}
                </div>
            }
            open={visible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            okText={mode === 'create' ? 'Thêm' : 'Cập nhật'}
            cancelText="Hủy"
            confirmLoading={submitting}
            maskClosable={false}
            width={1000}
            className="address-modal"
            okButtonProps={{ className: 'rounded-md' }}
            cancelButtonProps={{ className: 'rounded-md border-gray-300 hover:border-gray-400' }}
            bodyStyle={{ paddingTop: '1rem' }}
            style={{ top: 20 }}
        >
            <Spin spinning={isLoading || submitting}>
                {isProvincesError && !useTrackAsia && (
                    <Alert
                        message={`Không thể tải danh sách tỉnh/thành phố: ${provincesError?.toString()}`}
                        type="warning"
                        showIcon
                        className="mb-6 rounded-md shadow-sm"
                        action={
                            <Button size="small" onClick={invalidateAndRefetch} className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Thử lại
                            </Button>
                        }
                    />
                )}

                {!isProvincesError && !isValidData && !isLoading && !useTrackAsia && (
                    <Alert
                        message="Dữ liệu tỉnh/thành phố không hợp lệ. Đang sử dụng chế độ nhập thủ công."
                        type="warning"
                        showIcon
                        className="mb-6 rounded-md shadow-sm"
                        action={
                            <Button size="small" onClick={invalidateAndRefetch} className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Thử lại
                            </Button>
                        }
                    />
                )}

                {/* <Space className="mb-4 w-full justify-end">
                    {useTrackAsia ? (
                        <Button size="small" onClick={switchToProvinceAPI}>
                            Sử dụng API tỉnh/thành phố
                        </Button>
                    ) : (
                        <Button size="small" onClick={switchToTrackAsia}>
                            Sử dụng bản đồ
                        </Button>
                    )}
                </Space> */}

                <Row gutter={24}>
                    {/* Cột bên trái: Form nhập liệu */}
                    <Col span={useTrackAsia ? 12 : 24}>
                        {useTrackAsia && (
                            <div className="mb-6">
                                <label className="block mb-2 text-sm font-medium text-gray-700">Tìm kiếm địa chỉ:</label>
                                <div className="relative">
                                    <AddressSearch
                                        onPlaceSelect={handlePlaceSelect}
                                        initialValue={initialValues?.street}
                                        street={form.getFieldValue('street')}
                                        ward={form.getFieldValue('ward')}
                                        province={form.getFieldValue('province')}
                                    />
                                    <div className="mt-1 text-xs text-gray-500">
                                        Nhập địa chỉ để tìm kiếm (ít nhất 3 ký tự)
                                    </div>
                                </div>
                            </div>
                        )}

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            className="address-form"
                        >
                            {/* Đường */}
                            <Form.Item
                                name="street"
                                label={<span className="text-gray-700 font-medium">Đường/Số nhà</span>}
                                rules={[{ required: true, message: 'Vui lòng nhập tên đường và số nhà' }]}
                            >
                                <Input
                                    placeholder="Nhập tên đường và số nhà"
                                    className="rounded-md"
                                />
                            </Form.Item>

                            {/* Phường/Xã */}
                            {useTrackAsia ? (
                                <Form.Item
                                    name="ward"
                                    label={<span className="text-gray-700 font-medium">Phường/Xã</span>}
                                    rules={[{ required: true, message: 'Vui lòng nhập phường/xã' }]}
                                >
                                    <Input
                                        placeholder="Nhập phường/xã"
                                        className="rounded-md"
                                    />
                                </Form.Item>
                            ) : useManualInput ? (
                                <Form.Item
                                    name="ward"
                                    label={<span className="text-gray-700 font-medium">Phường/Xã</span>}
                                    rules={[{ required: true, message: 'Vui lòng nhập phường/xã' }]}
                                >
                                    <Input
                                        placeholder="Nhập phường/xã"
                                        className="rounded-md"
                                    />
                                </Form.Item>
                            ) : (
                                <Form.Item
                                    name="ward"
                                    label={<span className="text-gray-700 font-medium">Phường/Xã</span>}
                                    rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                                >
                                    <Select
                                        placeholder="Chọn phường/xã"
                                        loading={isLoading}
                                        disabled={!selectedProvince || isLoading}
                                        showSearch
                                        optionFilterProp="children"
                                        filterOption={customFilterOption}
                                        className="rounded-md"
                                    >
                                        {wards.map(ward => (
                                            <Select.Option key={ward.code} value={ward.code}>
                                                {ward.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}

                            {/* Tỉnh/Thành phố */}
                            {useTrackAsia ? (
                                <Form.Item
                                    name="province"
                                    label={<span className="text-gray-700 font-medium">Tỉnh/Thành phố</span>}
                                    rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
                                >
                                    <Input
                                        placeholder="Nhập tỉnh/thành phố"
                                        className="rounded-md"
                                    />
                                </Form.Item>
                            ) : (
                                <Form.Item
                                    name="province"
                                    label={<span className="text-gray-700 font-medium">Tỉnh/Thành phố</span>}
                                    rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                                >
                                    <Select
                                        placeholder="Chọn tỉnh/thành phố"
                                        loading={isLoading}
                                        disabled={isLoading}
                                        showSearch
                                        optionFilterProp="children"
                                        filterOption={customFilterOption}
                                        value={selectedProvince?.code}
                                        className="rounded-md"
                                    >
                                        {provinces.map(province => (
                                            <Select.Option key={province.code} value={province.code}>
                                                {province.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}

                            {/* Tọa độ (ẩn) */}
                            <Form.Item name="latitude" hidden={true}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="longitude" hidden={true}>
                                <Input />
                            </Form.Item>

                            {/* Loại địa chỉ */}
                            {showAddressType && (
                                <Form.Item
                                    name="addressType"
                                    label={<span className="text-gray-700 font-medium">Loại địa chỉ</span>}
                                    rules={[{ required: true, message: 'Vui lòng chọn loại địa chỉ' }]}
                                    className="mb-6"
                                >
                                    <Radio.Group className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-8">
                                        <Radio value={true} className="py-1">
                                            <span className="text-gray-800">Địa chỉ gửi hàng</span>
                                        </Radio>
                                        <Radio value={false} className="py-1">
                                            <span className="text-gray-800">Địa chỉ nhận hàng</span>
                                        </Radio>
                                    </Radio.Group>
                                </Form.Item>
                            )}

                            {/* Nút submit */}
                            {!useTrackAsia && (
                                <Form.Item>
                                    <Space className="w-full justify-end">
                                        <Button
                                            onClick={handleCancel}
                                            className="border border-gray-300 hover:border-gray-400 rounded-md"
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={submitting}
                                            className="rounded-md"
                                        >
                                            {mode === 'create' ? 'Thêm địa chỉ' : 'Cập nhật'}
                                        </Button>
                                    </Space>
                                </Form.Item>
                            )}
                        </Form>
                    </Col>

                    {/* Cột bên phải: Bản đồ */}
                    {useTrackAsia && (
                        <Col span={12}>
                            <div className="h-full">
                                <label className="block mb-2 text-sm font-medium text-gray-700">Bản đồ:</label>
                                <div className="h-[400px] border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                                    <AddressMap
                                        mapLocation={mapLocation}
                                        onLocationChange={handleLocationChange}
                                    />
                                </div>
                                <div className="mt-2 text-xs text-gray-500 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Click vào bản đồ để chọn vị trí chính xác
                                </div>
                            </div>
                        </Col>
                    )}
                </Row>
            </Spin>
        </Modal>
    );
};

export default AddressModal; 