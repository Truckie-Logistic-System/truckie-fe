import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    InputNumber,
    Button,
    Upload,
    message,
    Typography,
    Spin,
    Image,
    Tag,
    Space,
    Row,
    Col,
    Divider,
    Modal,
    App
} from 'antd';
import {
    UploadOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    InboxOutlined,
    ExclamationCircleOutlined,
    PhoneOutlined,
    MailOutlined,
    HomeOutlined,
    UserOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { Issue } from '@/models/Issue';
import refundService, { type ProcessRefundRequest, type Refund } from '@/services/refund';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface RefundProcessingDetailProps {
    issue: Issue;
    orderDetailId: string;  // Add orderDetailId prop
    onUpdate: (updatedIssue: Issue) => void;
}

const RefundProcessingDetail: React.FC<RefundProcessingDetailProps> = ({ issue, orderDetailId, onUpdate }) => {
    const { modal } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [refund, setRefund] = useState<Refund | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [loadingRefund, setLoadingRefund] = useState(true);

    useEffect(() => {
        loadRefundData();
    }, [issue.id]);

    const loadRefundData = async () => {
        setLoadingRefund(true);
        try {
            const refundData = await refundService.getRefundByIssueId(issue.id);
            setRefund(refundData);
        } catch (error) {
            console.error('Error loading refund:', error);
        } finally {
            setLoadingRefund(false);
        }
    };

    const uploadProps: UploadProps = {
        beforeUpload: (file) => {
            // Check if already have 1 image
            if (fileList.length >= 1) {
                message.error('Chỉ được upload 1 ảnh duy nhất!');
                return false;
            }
            
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Chỉ được upload file hình ảnh!');
                return false;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Hình ảnh phải nhỏ hơn 5MB!');
                return false;
            }
            
            // Create preview URL for the uploaded file
            const previewUrl = URL.createObjectURL(file);
            const uploadFile = {
                uid: file.uid || `-${Date.now()}`,
                name: file.name,
                status: 'done' as const,
                url: previewUrl,
                thumbUrl: previewUrl,
                originFileObj: file,
            };
            
            setFileList([uploadFile as any]);
            return false; // Prevent auto upload
        },
        fileList,
        onRemove: () => {
            // Revoke object URL to free memory
            if (fileList.length > 0 && fileList[0].url) {
                URL.revokeObjectURL(fileList[0].url);
            }
            setFileList([]);
        },
        maxCount: 1,
        listType: 'picture' as const,
        showUploadList: {
            showPreviewIcon: true,
            showRemoveIcon: true,
        },
    };

    const handleProcessRefund = async (values: any) => {
        // Show confirmation modal
        modal.confirm({
            title: 'Xác nhận xử lý đền bù',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p><strong>Bạn có chắc chắn muốn xử lý đền bù với thông tin sau?</strong></p>
                    <p>• Số tiền hoàn: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(values.refundAmount)}</strong></p>
                    <p>• Ngân hàng: <strong>{values.bankName}</strong></p>
                    <p>• Số tài khoản: <strong>{values.accountNumber}</strong></p>
                    <p>• Tên tài khoản: <strong>{values.accountHolderName}</strong></p>
                    <p style={{ marginTop: '12px', color: '#ff4d4f' }}>
                        <strong>⚠️ Lưu ý:</strong> Sau khi xác nhận, hành động này không thể hoàn tác!
                    </p>
                </div>
            ),
            okText: 'Xác nhận xử lý',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: async () => {
                console.log('📤 [RefundProcessing] Starting refund submission');
                console.log('   - FileList length:', fileList.length);
                if (fileList.length > 0) {
                    console.log('   - File[0]:', {
                        name: fileList[0].name,
                        size: fileList[0].size,
                        type: fileList[0].type,
                        hasOriginFileObj: !!fileList[0].originFileObj,
                        originFileObj: fileList[0].originFileObj,
                    });
                }
                
                setLoading(true);
                try {
                    // Get file from fileList
                    let imageFile: File | undefined;
                    if (fileList.length > 0) {
                        // Try originFileObj first (from beforeUpload), then the file itself
                        imageFile = (fileList[0].originFileObj || fileList[0]) as File;
                        console.log('   - Using image file:', {
                            name: imageFile.name,
                            size: imageFile.size,
                            type: imageFile.type,
                        });
                    }
                    
                    const request: ProcessRefundRequest = {
                        issueId: issue.id,
                        orderDetailId: orderDetailId,
                        refundAmount: values.refundAmount,
                        bankName: values.bankName,
                        accountNumber: values.accountNumber,
                        accountHolderName: values.accountHolderName,
                        transactionCode: values.transactionCode,
                        notes: values.notes,
                        bankTransferImage: imageFile,
                    };

                    const refundData = await refundService.processRefund(request);
                    message.success('Đã xử lý hoàn tiền thành công!');
                    setRefund(refundData);
                    form.resetFields();
                    setFileList([]);

                    // Update issue status
                    onUpdate({ ...issue, status: 'RESOLVED' });
                } catch (error: any) {
                    message.error(error.message || 'Không thể xử lý hoàn tiền');
                    console.error('Error processing refund:', error);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    if (loadingRefund) {
        return (
            <div className="flex justify-center items-center p-8">
                <Spin size="large" />
            </div>
        );
    }

    // If refund already processed, show read-only view
    if (refund) {
        return (
            <Card 
                className="shadow-lg"
                style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '2px solid #86efac'
                }}
            >
                <Row gutter={16} align="middle" className="mb-4">
                    <Col>
                        <div style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            borderRadius: '50%',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircleOutlined style={{ fontSize: '24px', color: 'white' }} />
                        </div>
                    </Col>
                    <Col flex="auto">
                        <Title level={4} className="mb-0" style={{ color: '#15803d' }}>Đã xử lý đền bù</Title>
                    </Col>
                    <Col>
                        <div style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            padding: '8px 16px',
                            borderRadius: '6px'
                        }}>
                            <Text strong style={{ fontSize: '18px', color: 'white' }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refund.refundAmount)}
                            </Text>
                        </div>
                    </Col>
                </Row>
                
                <Row gutter={24}>
                    {/* Left column - Information */}
                    <Col span={refund.bankTransferImage ? 16 : 24}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Ngân hàng</Text>
                                <div><Text strong>{refund.bankName}</Text></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Số tài khoản</Text>
                                <div><Text strong>{refund.accountNumber}</Text></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Tên tài khoản</Text>
                                <div><Text strong>{refund.accountHolderName}</Text></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Mã giao dịch</Text>
                                <div><Tag color="blue">{refund.transactionCode}</Tag></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Thời gian</Text>
                                <div><Text strong>{new Date(refund.refundDate).toLocaleString('vi-VN')}</Text></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Người xử lý</Text>
                                <div><Text strong>{refund.processedByStaff.fullName}</Text></div>
                            </div>
                            {refund.notes && (
                                <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Ghi chú</Text>
                                    <div><Text>{refund.notes}</Text></div>
                                </div>
                            )}
                        </Space>
                    </Col>
                    
                    {/* Right column - Image */}
                    {refund.bankTransferImage && (
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                                Chứng từ chuyển khoản
                            </Text>
                            <Image
                                src={refund.bankTransferImage}
                                alt="Bank transfer proof"
                                style={{ 
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '200px',
                                    objectFit: 'contain',
                                    borderRadius: '6px',
                                    border: '2px solid #86efac',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                preview={{
                                    mask: 'Xem full size'
                                }}
                            />
                        </Col>
                    )}
                </Row>
            </Card>
        );
    }

    // Debug: Log issue data to check sender
    console.log('[RefundProcessingDetail] Issue data:', {
        hasSender: !!issue.sender,
        sender: issue.sender,
        issueCategory: issue.issueCategory
    });

    // Show refund processing form
    return (
        <Card className="shadow-md">
            <div className="mb-4 flex items-center">
                <DollarOutlined className="text-blue-500 text-2xl mr-2" />
                <Title level={4} className="mb-0">Xử lý hoàn tiền cho hàng hư hại</Title>
            </div>

            {/* Show customer contact information */}
            {issue.sender && (
                <div style={{ 
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    padding: 16,
                    borderRadius: 8,
                    border: '2px solid #64b5f6',
                    marginBottom: 16
                }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                            <UserOutlined style={{ color: '#1976d2', fontSize: 16 }} />
                            <Text strong style={{ fontSize: 15, color: '#1976d2' }}>
                                Thông tin khách hàng (Người gửi)
                            </Text>
                        </Space>
                        <div style={{ marginLeft: 24 }}>
                            <Row gutter={[16, 8]}>
                                {issue.sender.companyName && (
                                    <Col span={12}>
                                        <Space>
                                            <HomeOutlined style={{ color: '#1976d2' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Công ty:</Text>
                                                <br />
                                                <Text strong>{issue.sender.companyName}</Text>
                                            </div>
                                        </Space>
                                    </Col>
                                )}
                                {issue.sender.representativeName && (
                                    <Col span={12}>
                                        <Space>
                                            <UserOutlined style={{ color: '#1976d2' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Người đại diện:</Text>
                                                <br />
                                                <Text strong>{issue.sender.representativeName}</Text>
                                            </div>
                                        </Space>
                                    </Col>
                                )}
                                {issue.sender.representativePhone && (
                                    <Col span={12}>
                                        <Space>
                                            <PhoneOutlined style={{ color: '#1976d2' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Số điện thoại:</Text>
                                                <br />
                                                <Text strong copyable style={{ color: '#1976d2' }}>{issue.sender.representativePhone}</Text>
                                            </div>
                                        </Space>
                                    </Col>
                                )}
                                {issue.sender.userResponse?.email && (
                                    <Col span={12}>
                                        <Space>
                                            <MailOutlined style={{ color: '#1976d2' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Email:</Text>
                                                <br />
                                                <Text strong copyable style={{ color: '#1976d2' }}>{issue.sender.userResponse.email}</Text>
                                            </div>
                                        </Space>
                                    </Col>
                                )}
                                {issue.sender.businessAddress && (
                                    <Col span={24}>
                                        <Space align="start">
                                            <HomeOutlined style={{ color: '#1976d2', marginTop: 4 }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Địa chỉ kinh doanh:</Text>
                                                <br />
                                                <Text>{issue.sender.businessAddress}</Text>
                                            </div>
                                        </Space>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    </Space>
                </div>
            )}

            {/* Show damaged package info */}
            {(issue.orderDetailEntity || issue.orderDetail) && (
                <div style={{ 
                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                    padding: 16,
                    borderRadius: 8,
                    border: '2px solid #ba68c8',
                    marginBottom: 16
                }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                            <InboxOutlined style={{ color: '#7b1fa2', fontSize: 16 }} />
                            <Text strong style={{ fontSize: 15, color: '#7b1fa2' }}>
                                Kiện hàng bị hư hại
                            </Text>
                        </Space>
                        <div style={{ marginLeft: 24 }}>
                            <Row gutter={[16, 8]}>
                                {(issue.orderDetailEntity?.packageName || issue.orderDetail?.description) && (
                                    <Col span={24}>
                                        <Text type="secondary">Tên/Mô tả:</Text>
                                        <br />
                                        <Text strong>{issue.orderDetailEntity?.packageName || issue.orderDetail?.description}</Text>
                                    </Col>
                                )}
                                {(issue.orderDetailEntity?.trackingCode || issue.orderDetail?.trackingCode) && (
                                    <Col span={12}>
                                        <Text type="secondary">Mã tracking:</Text>
                                        <br />
                                        <Text strong>{issue.orderDetailEntity?.trackingCode || issue.orderDetail?.trackingCode}</Text>
                                    </Col>
                                )}
                                {(issue.orderDetail?.weightBaseUnit && issue.orderDetail?.unit) && (
                                    <Col span={12}>
                                        <Text type="secondary">Khối lượng:</Text>
                                        <br />
                                        <Text strong>{issue.orderDetail.weightBaseUnit} {issue.orderDetail.unit}</Text>
                                    </Col>
                                )}
                                {(issue.orderDetailEntity?.status) && (
                                    <Col span={24}>
                                        <Text type="secondary">Trạng thái:</Text>
                                        <br />
                                        <Tag color="orange">{issue.orderDetailEntity.status}</Tag>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    </Space>
                </div>
            )}

            {/* Show damage images reported by driver */}
            {issue.issueImages && issue.issueImages.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <Text strong className="text-red-700">Hình ảnh hàng hóa hư hại:</Text>
                    <div className="mt-3">
                        <Image.PreviewGroup>
                            <div className="grid grid-cols-3 gap-3">
                                {issue.issueImages.map((imageUrl, index) => (
                                    <Image
                                        key={index}
                                        src={imageUrl}
                                        alt={`Hàng hóa hư hại ${index + 1}`}
                                        style={{ 
                                            width: '100%',
                                            height: 'auto',
                                            maxHeight: '300px',
                                            objectFit: 'contain',
                                            borderRadius: '4px',
                                            border: '1px solid #ef5350',
                                            cursor: 'pointer'
                                        }}
                                        preview={{
                                            mask: 'Xem full size'
                                        }}
                                    />
                                ))}
                            </div>
                        </Image.PreviewGroup>
                    </div>
                </div>
            )}

            <Divider />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleProcessRefund}
                initialValues={{
                    refundAmount: 0,
                }}
            >
                <Row gutter={24}>
                    {/* Left column - Information fields */}
                    <Col span={14}>
                        <Form.Item
                            label="Số tiền hoàn"
                            name="refundAmount"
                            rules={[
                                { required: true, message: 'Vui lòng nhập số tiền hoàn!' },
                                { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0!' },
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                addonAfter="VNĐ"
                                placeholder="Nhập số tiền hoàn"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Ngân hàng"
                            name="bankName"
                            rules={[{ required: true, message: 'Vui lòng nhập tên ngân hàng!' }]}
                        >
                            <Input placeholder="Ví dụ: Vietcombank, Techcombank..." />
                        </Form.Item>

                        <Form.Item
                            label="Số tài khoản"
                            name="accountNumber"
                            rules={[{ required: true, message: 'Vui lòng nhập số tài khoản!' }]}
                        >
                            <Input placeholder="Nhập số tài khoản nhận tiền" />
                        </Form.Item>

                        <Form.Item
                            label="Tên chủ tài khoản"
                            name="accountHolderName"
                            rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản!' }]}
                        >
                            <Input placeholder="Nhập tên chủ tài khoản" />
                        </Form.Item>

                        <Form.Item
                            label="Mã giao dịch"
                            name="transactionCode"
                            rules={[{ required: true, message: 'Vui lòng nhập mã giao dịch!' }]}
                        >
                            <Input placeholder="Nhập mã giao dịch từ ngân hàng" />
                        </Form.Item>

                        <Form.Item
                            label="Ghi chú"
                            name="notes"
                        >
                            <TextArea
                                rows={3}
                                placeholder="Ghi chú thêm về giao dịch hoàn tiền (nếu có)"
                            />
                        </Form.Item>
                    </Col>

                    {/* Right column - Image upload */}
                    <Col span={10}>
                        <Form.Item
                            label="Ảnh chứng từ chuyển khoản"
                            style={{ marginBottom: 0 }}
                        >
                            <div style={{ 
                                background: '#fafafa',
                                padding: '0px',
                                borderRadius: '8px',
                                border: '2px dashed #d9d9d9',
                                minHeight: '380px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}>
                                {fileList.length > 0 ? (
                                    <Image.PreviewGroup>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            width: '100%'
                                        }}>
                                            <div style={{
                                                position: 'relative',
                                                cursor: 'pointer'
                                            }}>
                                                <Image
                                                    src={fileList[0].url}
                                                    alt="Upload preview"
                                                    style={{
                                                        width: '300px',
                                                        height: '500px',
                                                        objectFit: 'contain',
                                                        borderRadius: '4px',
                                                        border: '1px solid #1890ff',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                                                    }}
                                                    preview={{
                                                        mask: 'Xem fullsize',
                                                        scaleStep: 0.05,
                                                        minScale: 0.5,
                                                        maxScale: 8
                                                    }}
                                                />
                                                <Button
                                                    type="primary"
                                                    danger
                                                    size="small"
                                                    onClick={() => {
                                                        setFileList([]);
                                                        if (fileList.length > 0 && fileList[0].url) {
                                                            URL.revokeObjectURL(fileList[0].url);
                                                        }
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-10px',
                                                        right: '-10px',
                                                        borderRadius: '50%',
                                                        padding: '2px 6px',
                                                        minWidth: '28px',
                                                        height: '28px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 8px rgba(255,0,0,0.3)'
                                                    }}
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        </div>
                                    </Image.PreviewGroup>
                                ) : (
                                    <Upload {...uploadProps}>
                                        <Button icon={<UploadOutlined />} type="dashed">
                                            Chọn ảnh hoặc kéo thả
                                        </Button>
                                    </Upload>
                                )}
                            </div>
                            <Text type="secondary" className="text-xs mt-2 block">
                                Chỉ chấp nhận file hình ảnh, tối đa 5MB.
                            </Text>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                size="large"
                                block
                                className="bg-blue-500"
                            >
                                Xác nhận hoàn tiền
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default RefundProcessingDetail;
