import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Row, Col, App, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderSize, OrderSizeCreateDto, OrderSizeUpdateDto } from '../../../../models/OrderSize';
import { orderSizeService } from '../../../../services';

const { TextArea } = Input;
const { Text } = Typography;

interface OrderSizeModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    orderSize?: OrderSize | null;
}

interface FormValues {
    minLength: number;
    maxLength: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    description: string;
}

const OrderSizeModal: React.FC<OrderSizeModalProps> = ({
    open,
    onCancel,
    onSuccess,
    orderSize
}) => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [form] = Form.useForm<FormValues>();
    const isEdit = !!orderSize;

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: OrderSizeCreateDto) => orderSizeService.createOrderSize(data),
        onSuccess: () => {
            message.success('Tạo kích thước thành công');
            queryClient.invalidateQueries({ queryKey: ['orderSizes'] });
            onSuccess();
        },
        onError: (error: any) => {
            message.error(error?.message || 'Có lỗi xảy ra khi tạo kích thước');
        }
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: OrderSizeUpdateDto) => orderSizeService.updateOrderSize(data),
        onSuccess: () => {
            message.success('Cập nhật kích thước thành công');
            queryClient.invalidateQueries({ queryKey: ['orderSizes'] });
            onSuccess();
        },
        onError: (error: any) => {
            message.error(error?.message || 'Có lỗi xảy ra khi cập nhật kích thước');
        }
    });

    useEffect(() => {
        if (open) {
            if (isEdit && orderSize) {
                form.setFieldsValue({
                    minLength: orderSize.minLength,
                    maxLength: orderSize.maxLength,
                    minWidth: orderSize.minWidth,
                    maxWidth: orderSize.maxWidth,
                    minHeight: orderSize.minHeight,
                    maxHeight: orderSize.maxHeight,
                    description: orderSize.description || '',
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, isEdit, orderSize, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            if (isEdit && orderSize) {
                const updateData: OrderSizeUpdateDto = {
                    id: orderSize.id,
                    ...values
                };
                updateMutation.mutate(updateData);
            } else {
                const createData: OrderSizeCreateDto = values;
                createMutation.mutate(createData);
            }
        } catch (error) {
            // Form validation failed
        }
    };

    const validateMaxGreaterThanMin = (minField: keyof FormValues) => {
        return {
            validator(_: any, value: number) {
                if (!value) {
                    return Promise.resolve();
                }
                
                const minValue = form.getFieldValue(minField);
                if (minValue && value <= minValue) {
                    return Promise.reject(new Error('Giá trị tối đa phải lớn hơn giá trị tối thiểu'));
                }
                return Promise.resolve();
            },
        };
    };

    const validateMinGreaterThanZero = () => {
        return {
            validator(_: any, value: number) {
                if (value !== undefined && value !== null && value <= 0) {
                    return Promise.reject(new Error('Giá trị phải lớn hơn 0'));
                }
                return Promise.resolve();
            },
        };
    };

    return (
        <Modal
            title={isEdit ? 'Chỉnh sửa kích thước kiện hàng' : 'Thêm kích thước kiện hàng mới'}
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={createMutation.isPending || updateMutation.isPending}
            width={700}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
            >
                <div className="mb-6">
                    <Form.Item label="Kích thước (mét)" required>
                        <Row gutter={4} align="middle">
                            <Col span={3}>
                                <Form.Item
                                    name="minLength"
                                    rules={[
                                        { required: true, message: '' },
                                        validateMinGreaterThanZero()
                                    ]}
                                    noStyle
                                >
                                    <InputNumber
                                        placeholder="Dài"
                                        className="w-full"
                                        min={0.01}
                                        step={0.01}
                                        precision={2}
                                        size="small"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={1}>
                                <Text className="text-center block">×</Text>
                            </Col>
                            <Col span={3}>
                                <Form.Item
                                    name="minWidth"
                                    rules={[
                                        { required: true, message: '' },
                                        validateMinGreaterThanZero()
                                    ]}
                                    noStyle
                                >
                                    <InputNumber
                                        placeholder="Rộng"
                                        className="w-full"
                                        min={0.01}
                                        step={0.01}
                                        precision={2}
                                        size="small"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={1}>
                                <Text className="text-center block">×</Text>
                            </Col>
                            <Col span={3}>
                                <Form.Item
                                    name="minHeight"
                                    rules={[
                                        { required: true, message: '' },
                                        validateMinGreaterThanZero()
                                    ]}
                                    noStyle
                                >
                                    <InputNumber
                                        placeholder="Cao"
                                        className="w-full"
                                        min={0.01}
                                        step={0.01}
                                        precision={2}
                                        size="small"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={1}>
                                <Text className="text-center block">-</Text>
                            </Col>
                            <Col span={3}>
                                <Form.Item
                                    name="maxLength"
                                    rules={[
                                        { required: true, message: '' },
                                        validateMinGreaterThanZero(),
                                        validateMaxGreaterThanMin('minLength')
                                    ]}
                                    noStyle
                                >
                                    <InputNumber
                                        placeholder="Dài"
                                        className="w-full"
                                        min={0.01}
                                        step={0.01}
                                        precision={2}
                                        size="small"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={1}>
                                <Text className="text-center block">×</Text>
                            </Col>
                            <Col span={3}>
                                <Form.Item
                                    name="maxWidth"
                                    rules={[
                                        { required: true, message: '' },
                                        validateMinGreaterThanZero(),
                                        validateMaxGreaterThanMin('minWidth')
                                    ]}
                                    noStyle
                                >
                                    <InputNumber
                                        placeholder="Rộng"
                                        className="w-full"
                                        min={0.01}
                                        step={0.01}
                                        precision={2}
                                        size="small"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={1}>
                                <Text className="text-center block">×</Text>
                            </Col>
                            <Col span={3}>
                                <Form.Item
                                    name="maxHeight"
                                    rules={[
                                        { required: true, message: '' },
                                        validateMinGreaterThanZero(),
                                        validateMaxGreaterThanMin('minHeight')
                                    ]}
                                    noStyle
                                >
                                    <InputNumber
                                        placeholder="Cao"
                                        className="w-full"
                                        min={0.01}
                                        step={0.01}
                                        precision={2}
                                        size="small"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <div className="mt-2">
                            <Text type="secondary" className="text-xs">
                                Định dạng: Tối thiểu (Dài × Rộng × Cao) - Tối đa (Dài × Rộng × Cao)
                            </Text>
                            <br />
                            <Text type="secondary" className="text-xs">
                                Đơn vị: mét (m) - Ví dụ: 0.1 × 0.2 × 0.3 - 0.5 × 0.6 × 0.7
                            </Text>
                        </div>
                    </Form.Item>
                </div>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mô tả' },
                        { max: 200, message: 'Mô tả không được vượt quá 200 ký tự' }
                    ]}
                >
                    <TextArea
                        placeholder="Nhập mô tả về kích thước này"
                        rows={3}
                        maxLength={200}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default OrderSizeModal;
