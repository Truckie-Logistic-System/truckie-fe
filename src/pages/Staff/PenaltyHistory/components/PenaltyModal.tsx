import React, { useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select,
    Button,
    Descriptions
} from 'antd';
import dayjs from 'dayjs';
import type { Penalty, PenaltyCreateDto, PenaltyUpdateDto } from '@/models/Penalty';
import { PenaltyStatus, violationTypes } from '@/models/Penalty';

interface PenaltyModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: PenaltyCreateDto | PenaltyUpdateDto, mode: 'create' | 'edit') => void;
    penalty: Penalty | null;
    mode: 'create' | 'edit' | 'view';
}

const { Option } = Select;
const { TextArea } = Input;

const PenaltyModal: React.FC<PenaltyModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    penalty,
    mode
}) => {
    const [form] = Form.useForm();
    const isViewMode = mode === 'view';
    const title =
        mode === 'create' ? 'Thêm vi phạm mới' :
            mode === 'edit' ? 'Chỉnh sửa vi phạm' :
                'Chi tiết vi phạm';

    useEffect(() => {
        if (visible && penalty && (mode === 'edit' || mode === 'view')) {
            form.setFieldsValue({
                ...penalty,
                penaltyDate: penalty.penaltyDate ? dayjs(penalty.penaltyDate) : undefined,
                paymentDate: penalty.paymentDate ? dayjs(penalty.paymentDate) : undefined,
            });
        } else if (visible && mode === 'create') {
            form.resetFields();
            // Set default values for new penalty
            form.setFieldsValue({
                status: PenaltyStatus.PENDING,
                penaltyDate: dayjs(),
            });
        }
    }, [visible, penalty, mode, form]);

    const handleOk = async () => {
        if (isViewMode) {
            onCancel();
            return;
        }

        try {
            const values = await form.validateFields();
            // Convert dayjs objects to ISO strings
            const formattedValues = {
                ...values,
                penaltyDate: values.penaltyDate ? values.penaltyDate.format('YYYY-MM-DD') : undefined,
            };

            onSubmit(formattedValues, mode as 'create' | 'edit');
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    // Render view mode
    if (isViewMode && penalty) {
        return (
            <Modal
                title={title}
                open={visible}
                onCancel={onCancel}
                footer={[
                    <Button key="back" onClick={onCancel}>
                        Đóng
                    </Button>
                ]}
                width={700}
            >
                <Descriptions bordered column={1} className="mt-4">
                    <Descriptions.Item label="Loại vi phạm">{penalty.violationType}</Descriptions.Item>
                    <Descriptions.Item label="Mô tả vi phạm">{penalty.violationDescription}</Descriptions.Item>
                    <Descriptions.Item label="Số tiền phạt">{penalty.penaltyAmount.toLocaleString()} VND</Descriptions.Item>
                    <Descriptions.Item label="Ngày vi phạm">
                        {dayjs(penalty.penaltyDate).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa điểm">{penalty.location}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">{penalty.status}</Descriptions.Item>
                    {penalty.paymentDate && (
                        <Descriptions.Item label="Ngày thanh toán">
                            {dayjs(penalty.paymentDate).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                    )}
                    {penalty.disputeReason && (
                        <Descriptions.Item label="Lý do khiếu nại">{penalty.disputeReason}</Descriptions.Item>
                    )}
                    <Descriptions.Item label="ID Tài xế">{penalty.driverId}</Descriptions.Item>
                    <Descriptions.Item label="ID Phân công xe">{penalty.vehicleAssignmentId}</Descriptions.Item>
                </Descriptions>
            </Modal>
        );
    }

    // Render edit/create mode
    return (
        <Modal
            title={title}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            okText={mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            cancelText="Hủy"
            width={700}
        >
            <Form
                form={form}
                layout="vertical"
                className="mt-4"
            >
                <Form.Item
                    name="violationType"
                    label="Loại vi phạm"
                    rules={[{ required: true, message: 'Vui lòng chọn loại vi phạm' }]}
                >
                    <Select placeholder="Chọn loại vi phạm">
                        {violationTypes.map(type => (
                            <Option key={type} value={type}>{type}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="violationDescription"
                    label="Mô tả vi phạm"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả vi phạm' }]}
                >
                    <TextArea rows={4} placeholder="Nhập mô tả chi tiết về vi phạm" />
                </Form.Item>

                <Form.Item
                    name="penaltyAmount"
                    label="Số tiền phạt (VND)"
                    rules={[{ required: true, message: 'Vui lòng nhập số tiền phạt' }]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value): any => value!.replace(/\$\s?|(,*)/g, '')}
                        placeholder="Nhập số tiền phạt"
                        min={0}
                    />
                </Form.Item>

                <Form.Item
                    name="penaltyDate"
                    label="Ngày vi phạm"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày vi phạm' }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày vi phạm"
                    />
                </Form.Item>

                <Form.Item
                    name="location"
                    label="Địa điểm"
                    rules={[{ required: true, message: 'Vui lòng nhập địa điểm vi phạm' }]}
                >
                    <Input placeholder="Nhập địa điểm xảy ra vi phạm" />
                </Form.Item>

                <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                    <Select placeholder="Chọn trạng thái">
                        {Object.values(PenaltyStatus).map(status => (
                            <Option key={status} value={status}>{status}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="driverId"
                    label="ID Tài xế"
                    rules={[{ required: true, message: 'Vui lòng nhập ID tài xế' }]}
                >
                    <Input placeholder="Nhập ID tài xế" />
                </Form.Item>

                <Form.Item
                    name="vehicleAssignmentId"
                    label="ID Phân công xe"
                    rules={[{ required: true, message: 'Vui lòng nhập ID phân công xe' }]}
                >
                    <Input placeholder="Nhập ID phân công xe" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PenaltyModal; 