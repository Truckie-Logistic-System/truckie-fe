import React, { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, InputNumber, Divider, App, Typography, Card, Tooltip, Table, Space } from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { SizeRule, SizeRuleRequest, UpdateSizeRuleRequest, SizeRuleCategory, SizeRuleType, BasingPrice, DistanceRule } from '../../../../models';

const { Text, Title } = Typography;

interface SizeRuleFormProps {
    initialValues?: SizeRule;
    onSubmit: (values: SizeRuleRequest | UpdateSizeRuleRequest) => void;
    onCancel: () => void;
    loading: boolean;
    categories: SizeRuleCategory[];
    vehicleTypes: SizeRuleType[];
}

interface BasingPriceFormItem {
    key: string;
    fromKm: number;
    toKm: number;
    basePrice: string;
    distanceRuleResponse?: DistanceRule;
}

const SizeRuleForm: React.FC<SizeRuleFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    loading,
    categories,
    vehicleTypes,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const isEditing = !!initialValues;
    const [basingPrices, setBasingPrices] = useState<BasingPriceFormItem[]>([]);

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                categoryId: initialValues.category.id,
                vehicleTypeId: initialValues.vehicleTypeEntity.id,
                effectiveFrom: initialValues.effectiveFrom ? dayjs(initialValues.effectiveFrom) : null,
                effectiveTo: initialValues.effectiveTo ? dayjs(initialValues.effectiveTo) : null,
            });

            // Chuyển đổi basingPrices từ API sang định dạng form
            if (initialValues.basingPrices && initialValues.basingPrices.length > 0) {
                const formattedPrices = initialValues.basingPrices.map(price => ({
                    key: price.id,
                    fromKm: price.distanceRuleResponse.fromKm,
                    toKm: price.distanceRuleResponse.toKm,
                    basePrice: price.basePrice,
                    distanceRuleResponse: price.distanceRuleResponse,
                }));
                setBasingPrices(formattedPrices);
            }
        }
    }, [initialValues, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (isEditing && initialValues) {
                // For update, don't include sizeRuleName
                const updateValues: UpdateSizeRuleRequest = {
                    id: initialValues.id,
                    minWeight: values.minWeight,
                    maxWeight: values.maxWeight,
                    minLength: values.minLength,
                    maxLength: values.maxLength,
                    minWidth: values.minWidth,
                    maxWidth: values.maxWidth,
                    minHeight: values.minHeight,
                    maxHeight: values.maxHeight,
                    status: values.status,
                    effectiveFrom: values.effectiveFrom ? values.effectiveFrom.format('YYYY-MM-DDTHH:mm:ss') : dayjs().format('YYYY-MM-DDTHH:mm:ss'),
                    effectiveTo: values.effectiveTo ? values.effectiveTo.format('YYYY-MM-DDTHH:mm:ss') : undefined,
                    categoryId: values.categoryId,
                    vehicleTypeId: values.vehicleTypeId,
                    basingPrices: basingPrices
                        .filter(price => price.key !== 'new' && price.distanceRuleResponse)
                        .map(price => ({
                            id: price.key as string,
                            basePrice: price.basePrice,
                            distanceRuleResponse: price.distanceRuleResponse!,
                        }))
                };
                onSubmit(updateValues);
            } else {
                // For create, include sizeRuleName
                const formattedValues: SizeRuleRequest = {
                    ...values,
                    effectiveFrom: values.effectiveFrom ? values.effectiveFrom.format('YYYY-MM-DDTHH:mm:ss') : dayjs().format('YYYY-MM-DDTHH:mm:ss'),
                    effectiveTo: values.effectiveTo ? values.effectiveTo.format('YYYY-MM-DDTHH:mm:ss') : undefined,
                    basingPrices: basingPrices
                        .filter(price => price.key !== 'new' && price.distanceRuleResponse)
                        .map(price => ({
                            id: price.key as string,
                            basePrice: price.basePrice,
                            distanceRuleResponse: price.distanceRuleResponse!,
                        }))
                };
                onSubmit(formattedValues);
            }
        } catch (error) {
            message.error('Vui lòng kiểm tra lại thông tin đã nhập');
        }
    };

    const addBasingPrice = () => {
        const newPrice: BasingPriceFormItem = {
            key: 'new' + Date.now(), // Tạo key tạm thời
            fromKm: 0,
            toKm: 0,
            basePrice: '0',
        };
        setBasingPrices([...basingPrices, newPrice]);
    };

    const removeBasingPrice = (key: string) => {
        setBasingPrices(basingPrices.filter(item => item.key !== key));
    };

    const updateBasingPrice = (key: string, field: string, value: any) => {
        setBasingPrices(prevPrices =>
            prevPrices.map(price =>
                price.key === key ? { ...price, [field]: value } : price
            )
        );
    };

    const basingPriceColumns = [
        {
            title: 'Từ (km)',
            dataIndex: 'fromKm',
            key: 'fromKm',
            width: '25%',
            render: (value: number, record: BasingPriceFormItem) => (
                <InputNumber
                    min={0}
                    value={value}
                    onChange={(val) => updateBasingPrice(record.key, 'fromKm', val)}
                    className="w-full"
                    placeholder="Từ km"
                />
            ),
        },
        {
            title: 'Đến (km)',
            dataIndex: 'toKm',
            key: 'toKm',
            width: '25%',
            render: (value: number, record: BasingPriceFormItem) => (
                <InputNumber
                    min={0}
                    value={value}
                    onChange={(val) => updateBasingPrice(record.key, 'toKm', val)}
                    className="w-full"
                    placeholder="Đến km"
                />
            ),
        },
        {
            title: 'Giá cơ bản (VND)',
            dataIndex: 'basePrice',
            key: 'basePrice',
            width: '40%',
            render: (value: string, record: BasingPriceFormItem) => (
                <InputNumber
                    min={0}
                    value={parseInt(value || '0')}
                    onChange={(val) => updateBasingPrice(record.key, 'basePrice', val?.toString() || '0')}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => {
                        const parsed = value?.replace(/\$\s?|(,*)/g, '') || '0';
                        return Number(parsed);
                    }}
                    className="w-full"
                    placeholder="Nhập giá"
                />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '10%',
            render: (_: unknown, record: BasingPriceFormItem) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeBasingPrice(record.key)}
                />
            ),
        },
    ];

    return (
        <div className="vehicle-rule-form">
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    status: 'ACTIVE',
                }}
                className="p-1"
            >
                <Card className="mb-6 shadow-sm">
                    <Title level={5} className="mb-4">
                        <span className="mr-2">Thông tin cơ bản</span>
                        <Tooltip title="Nhập thông tin cơ bản của quy tắc vận chuyển">
                            <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                    </Title>

                    <Row gutter={16}>
                        {!isEditing && (
                            <Col span={12}>
                                <Form.Item
                                    name="sizeRuleName"
                                    label="Tên quy tắc"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên quy tắc' }]}
                                >
                                    <Input placeholder="Nhập tên quy tắc" />
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={12}>
                            <Form.Item
                                name="status"
                                label="Trạng thái"
                                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                                initialValue={isEditing ? initialValues?.status : 'ACTIVE'}
                            >
                                <Select disabled={!isEditing}>
                                    <Select.Option value="ACTIVE">Hoạt động</Select.Option>
                                    <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="vehicleTypeId"
                                label="Loại xe"
                                rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}
                            >
                                <Select placeholder="Chọn loại xe" showSearch optionFilterProp="children">
                                    {vehicleTypes.map(type => (
                                        <Select.Option key={type.id} value={type.id}>
                                            {type.vehicleTypeName}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="categoryId"
                                label="Loại hàng"
                                rules={[{ required: true, message: 'Vui lòng chọn loại hàng' }]}
                            >
                                <Select placeholder="Chọn loại hàng" showSearch optionFilterProp="children">
                                    {categories.map(category => (
                                        <Select.Option key={category.id} value={category.id}>
                                            {category.categoryName}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="effectiveFrom"
                                label="Hiệu lực từ"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn ngày bắt đầu hiệu lực' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const effectiveTo = getFieldValue('effectiveTo');
                                            if (value && effectiveTo && value.isAfter(effectiveTo)) {
                                                return Promise.reject(new Error('Ngày bắt đầu phải trước ngày kết thúc'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                                dependencies={['effectiveTo']}
                            >
                                <DatePicker
                                    className="w-full"
                                    showTime
                                    format="DD/MM/YYYY HH:mm:ss"
                                    placeholder="Chọn ngày bắt đầu"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="effectiveTo"
                                label="Hiệu lực đến"
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value) return Promise.resolve();
                                            const effectiveFrom = getFieldValue('effectiveFrom');
                                            if (effectiveFrom && value.isBefore(effectiveFrom)) {
                                                return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                                dependencies={['effectiveFrom']}
                            >
                                <DatePicker
                                    className="w-full"
                                    showTime
                                    format="DD/MM/YYYY HH:mm:ss"
                                    placeholder="Chọn ngày kết thúc (không bắt buộc)"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card className="mb-6 shadow-sm">
                    <Title level={5} className="mb-4">
                        <span className="mr-2">Thông số kỹ thuật</span>
                        <Tooltip title="Nhập thông số kỹ thuật của phương tiện vận chuyển">
                            <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                    </Title>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Card className="bg-gray-50 mb-4">
                                <Title level={5} className="mb-3">Trọng lượng (tấn)</Title>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="minWeight"
                                            label="Tối thiểu"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập trọng lượng tối thiểu' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const maxWeight = getFieldValue('maxWeight');
                                                        if (value !== undefined && maxWeight !== undefined && value > maxWeight) {
                                                            return Promise.reject(new Error('Trọng lượng tối thiểu phải nhỏ hơn tối đa'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['maxWeight']}
                                        >
                                            <InputNumber className="w-full" min={0} step={0.01} placeholder="Nhập trọng lượng tối thiểu" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="maxWeight"
                                            label="Tối đa"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập trọng lượng tối đa' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const minWeight = getFieldValue('minWeight');
                                                        if (value !== undefined && minWeight !== undefined && value < minWeight) {
                                                            return Promise.reject(new Error('Trọng lượng tối đa phải lớn hơn tối thiểu'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['minWeight']}
                                        >
                                            <InputNumber className="w-full" min={0} step={0.01} placeholder="Nhập trọng lượng tối đa" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col span={12}>
                            <Card className="bg-gray-50 mb-4">
                                <Title level={5} className="mb-3">Kích thước (m)</Title>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="minLength"
                                            label="Chiều dài tối thiểu"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập chiều dài tối thiểu' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const maxLength = getFieldValue('maxLength');
                                                        if (value !== undefined && maxLength !== undefined && value > maxLength) {
                                                            return Promise.reject(new Error('Chiều dài tối thiểu phải nhỏ hơn tối đa'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['maxLength']}
                                        >
                                            <InputNumber className="w-full" min={0} step={0.01} placeholder="Nhập chiều dài tối thiểu" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="maxLength"
                                            label="Chiều dài tối đa"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập chiều dài tối đa' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const minLength = getFieldValue('minLength');
                                                        if (value !== undefined && minLength !== undefined && value < minLength) {
                                                            return Promise.reject(new Error('Chiều dài tối đa phải lớn hơn tối thiểu'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['minLength']}
                                        >
                                            <InputNumber className="w-full" min={0} step={0.01} placeholder="Nhập chiều dài tối đa" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="minWidth"
                                            label="Chiều rộng tối thiểu"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập chiều rộng tối thiểu' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const maxWidth = getFieldValue('maxWidth');
                                                        if (value !== undefined && maxWidth !== undefined && value > maxWidth) {
                                                            return Promise.reject(new Error('Chiều rộng tối thiểu phải nhỏ hơn tối đa'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['maxWidth']}
                                        >
                                            <InputNumber className="w-full" min={0} step={0.01} placeholder="Nhập chiều rộng tối thiểu" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="maxWidth"
                                            label="Chiều rộng tối đa"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập chiều rộng tối đa' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const minWidth = getFieldValue('minWidth');
                                                        if (value !== undefined && minWidth !== undefined && value < minWidth) {
                                                            return Promise.reject(new Error('Chiều rộng tối đa phải lớn hơn tối thiểu'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['minWidth']}
                                        >
                                            <InputNumber className="w-full" min={0} step={0.01} placeholder="Nhập chiều rộng tối đa" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="minHeight"
                                            label="Chiều cao tối thiểu"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập chiều cao tối thiểu' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const maxHeight = getFieldValue('maxHeight');
                                                        if (value !== undefined && maxHeight !== undefined && value > maxHeight) {
                                                            return Promise.reject(new Error('Chiều cao tối thiểu phải nhỏ hơn tối đa'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['maxHeight']}
                                        >
                                            <InputNumber className="w-full" min={0} step={0.01} placeholder="Nhập chiều cao tối thiểu" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="maxHeight"
                                            label="Chiều cao tối đa"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập chiều cao tối đa' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const minHeight = getFieldValue('minHeight');
                                                        if (value !== undefined && minHeight !== undefined && value < minHeight) {
                                                            return Promise.reject(new Error('Chiều cao tối đa phải lớn hơn tối thiểu'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['minHeight']}
                                        >
                                            <InputNumber className="w-full" min={0} step={0.01} placeholder="Nhập chiều cao tối đa" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                <Card className="mb-6 shadow-sm">
                    <Title level={5} className="mb-4">
                        <span className="mr-2">Bảng giá theo khoảng cách</span>
                        <Tooltip title="Thiết lập giá cước vận chuyển theo khoảng cách">
                            <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                    </Title>

                    <div className="mb-4">
                        <Button
                            type="dashed"
                            onClick={addBasingPrice}
                            icon={<PlusOutlined />}
                            className="w-full"
                        >
                            Thêm mức giá
                        </Button>
                    </div>

                    <Table
                        dataSource={basingPrices}
                        columns={basingPriceColumns}
                        pagination={false}
                        rowKey="key"
                        size="middle"
                        locale={{ emptyText: 'Chưa có thông tin giá. Nhấn "Thêm mức giá" để bắt đầu.' }}
                        className="shadow-sm"
                    />
                </Card>

                <div className="flex justify-end mt-6">
                    <Space>
                        <Button
                            onClick={onCancel}
                            icon={<CloseOutlined />}
                            disabled={loading}
                            size="large"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={loading}
                            icon={<SaveOutlined />}
                            size="large"
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isEditing ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </Space>
                </div>
            </Form>
        </div>
    );
};

export default SizeRuleForm; 