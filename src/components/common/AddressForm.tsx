import React, { useEffect } from 'react';
import { Form, Input, Select, Radio, Typography } from 'antd';
import type { Ward } from '../../models/Province';

const { Title } = Typography;

interface AddressFormProps {
    form: any;
    useManualInput: boolean;
    useTrackAsia: boolean;
    isValidData: boolean;
    wards: Ward[];
    selectedProvince: any;
    switchToManualInput: () => void;
    switchToDropdownMode: () => void;
    customFilterOption: (input: string, option: any) => boolean;
    showAddressType: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
    form,
    useManualInput,
    useTrackAsia,
    isValidData,
    wards,
    selectedProvince,
    switchToManualInput,
    switchToDropdownMode,
    customFilterOption,
    showAddressType
}) => {
    // Force re-render when form values change
    useEffect(() => {
        const values = form.getFieldsValue();
    }, [form]);

    return (
        <>
            <Title level={5} className="mb-3">Thông tin địa chỉ</Title>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ addressType: true }}
                preserve={false}
            >
                <Form.Item
                    name="street"
                    label="Đường/Số nhà"
                    rules={[{ required: true, message: 'Vui lòng nhập đường/số nhà' }]}
                >
                    <Input placeholder="Nhập đường và số nhà" />
                </Form.Item>

                {!useTrackAsia && !useManualInput && isValidData && wards.length > 0 ? (
                    <>
                        <Form.Item
                            name="ward"
                            label="Phường/Xã"
                            rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                            extra={
                                <a onClick={switchToManualInput} className="text-blue-500 text-sm">
                                    Nhập thủ công
                                </a>
                            }
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
                ) : (!useTrackAsia ? (
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
                ) : (
                    <>
                        <Form.Item
                            name="ward"
                            label="Phường/Xã"
                            rules={[{ required: true, message: 'Vui lòng nhập phường/xã' }]}
                        >
                            <Input placeholder="Phường/Xã sẽ được điền tự động từ bản đồ" />
                        </Form.Item>

                        <Form.Item
                            name="province"
                            label="Tỉnh/Thành phố"
                            initialValue="Thành phố Hồ Chí Minh"
                            rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
                        >
                            <Input
                                placeholder="Tỉnh/Thành phố sẽ được điền tự động từ bản đồ"
                                disabled
                            />
                        </Form.Item>
                    </>
                ))}

                {/* Hidden fields for coordinates */}
                <Form.Item name="latitude" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="longitude" hidden>
                    <Input />
                </Form.Item>

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
        </>
    );
};

export default AddressForm; 