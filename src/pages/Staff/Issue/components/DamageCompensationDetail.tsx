import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Form,
    InputNumber,
    Switch,
    Input,
    Button,
    Select,
    Statistic,
    Row,
    Col,
    Alert,
    Divider,
    Tag,
    Tooltip,
    Typography,
    Spin,
    message,
    Image,
    Descriptions
} from 'antd';
import {
    DollarOutlined,
    SafetyCertificateOutlined,
    FileTextOutlined,
    CalculatorOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    SaveOutlined,
    UserOutlined,
    PhoneOutlined,
    ShopOutlined
} from '@ant-design/icons';
import type { Issue, DamageCompensationStatus } from '@/models/Issue';
import {
    formatCurrency,
    getDamageCompensationCaseColor,
    getDamageCompensationStatusColor,
    getDamageCompensationStatusLabel
} from '@/models/Issue';
import issueService from '@/services/issue/issueService';
import type { UpdateDamageCompensationRequest } from '@/services/issue/issueService';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface DamageCompensationDetailProps {
    issue: Issue;
    onUpdate?: (updatedIssue: Issue) => void;
}

/**
 * Component hiển thị và xử lý thông tin bồi thường cho DAMAGE issue
 * Theo chính sách bảo hiểm với 4 kịch bản:
 * - Case 1: Có BH + Có chứng từ → Bồi thường theo giá trị khai báo (không giới hạn)
 * - Case 2: Có BH + Không chứng từ → BH vô hiệu, giới hạn 10× cước phí
 * - Case 3: Không BH + Có chứng từ → Giới hạn 10× cước phí
 * - Case 4: Không BH + Không chứng từ → Giới hạn 10× cước phí, ước tính theo thị trường
 */
const DamageCompensationDetail: React.FC<DamageCompensationDetailProps> = ({
    issue,
    onUpdate
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Local state for real-time calculation preview
    const [previewValues, setPreviewValues] = useState({
        estimatedLoss: 0,
        legalLimit: 0,
        policyCompensation: 0,
        compensationCase: '',
        appliesLegalLimit: false
    });

    const compensation = issue.damageCompensation;
    const hasInsurance = compensation?.hasInsurance ?? false;

    // Initialize form with existing data
    useEffect(() => {
        if (compensation) {
            form.setFieldsValue({
                damageAssessmentPercent: compensation.damageAssessmentPercent,
                damageHasDocuments: compensation.damageHasDocuments ?? false,
                damageDeclaredValue: compensation.damageDeclaredValue,
                damageEstimatedMarketValue: compensation.damageEstimatedMarketValue,
                damageFinalCompensation: compensation.damageFinalCompensation,
                damageAdjustReason: compensation.damageAdjustReason,
                damageHandlerNote: compensation.damageHandlerNote,
                damageCompensationStatus: compensation.damageCompensationStatus
            });
            
            // Set preview values
            setPreviewValues({
                estimatedLoss: compensation.damageEstimatedLoss ?? 0,
                legalLimit: compensation.damageLegalLimit ?? 0,
                policyCompensation: compensation.damagePolicyCompensation ?? 0,
                compensationCase: compensation.damageCompensationCase ?? '',
                appliesLegalLimit: compensation.appliesLegalLimit ?? false
            });
        }
    }, [compensation, form]);

    // Calculate preview when form values change
    const calculatePreview = useCallback(() => {
        const values = form.getFieldsValue();
        const hasDocuments = values.damageHasDocuments ?? false;
        const damagePercent = values.damageAssessmentPercent ?? 0;
        const freightFee = compensation?.damageFreightFee ?? 0;
        
        // Determine base value
        let baseValue = 0;
        if (hasDocuments && values.damageDeclaredValue) {
            baseValue = values.damageDeclaredValue;
        } else if (values.damageEstimatedMarketValue) {
            baseValue = values.damageEstimatedMarketValue;
        }
        
        // Calculate estimated loss
        const estimatedLoss = (baseValue * damagePercent) / 100;
        
        // Calculate legal limit
        const legalLimit = freightFee * 10;
        
        // Determine case and policy compensation
        let compensationCase = '';
        let policyCompensation = 0;
        let appliesLegalLimit = true;
        
        if (hasInsurance && hasDocuments) {
            compensationCase = 'CASE1_HAS_INS_HAS_DOC';
            policyCompensation = estimatedLoss;
            appliesLegalLimit = false;
        } else if (hasInsurance && !hasDocuments) {
            compensationCase = 'CASE2_HAS_INS_NO_DOC';
            policyCompensation = Math.min(estimatedLoss, legalLimit);
        } else if (!hasInsurance && hasDocuments) {
            compensationCase = 'CASE3_NO_INS_HAS_DOC';
            policyCompensation = Math.min(estimatedLoss, legalLimit);
        } else {
            compensationCase = 'CASE4_NO_INS_NO_DOC';
            policyCompensation = Math.min(estimatedLoss, legalLimit);
        }
        
        setPreviewValues({
            estimatedLoss,
            legalLimit,
            policyCompensation,
            compensationCase,
            appliesLegalLimit
        });
    }, [form, compensation, hasInsurance]);

    // Handle form submission
    const handleSubmit = async (values: any) => {
        if (!issue.id) return;
        
        setSaving(true);
        try {
            const request: UpdateDamageCompensationRequest = {
                issueId: issue.id,
                damageAssessmentPercent: values.damageAssessmentPercent,
                damageHasDocuments: values.damageHasDocuments ?? false,
                damageDeclaredValue: values.damageDeclaredValue,
                damageEstimatedMarketValue: values.damageEstimatedMarketValue,
                damageFinalCompensation: values.damageFinalCompensation,
                damageAdjustReason: values.damageAdjustReason,
                damageHandlerNote: values.damageHandlerNote,
                damageCompensationStatus: values.damageCompensationStatus
            };
            
            const updatedIssue = await issueService.updateDamageCompensation(request);
            message.success('Đã cập nhật thông tin bồi thường thành công');
            onUpdate?.(updatedIssue);
        } catch (error: any) {
            message.error(error.message || 'Không thể cập nhật thông tin bồi thường');
        } finally {
            setSaving(false);
        }
    };

    // Get case description
    const getCaseDescription = (caseType: string): string => {
        switch (caseType) {
            case 'CASE1_HAS_INS_HAS_DOC':
                return 'Bồi thường theo giá trị khai báo, không giới hạn';
            case 'CASE2_HAS_INS_NO_DOC':
                return 'Bảo hiểm vô hiệu do thiếu chứng từ, áp dụng giới hạn 10× cước phí';
            case 'CASE3_NO_INS_HAS_DOC':
                return 'Không có bảo hiểm, áp dụng giới hạn 10× cước phí';
            case 'CASE4_NO_INS_NO_DOC':
                return 'Không có bảo hiểm và chứng từ, ước tính theo thị trường, giới hạn 10× cước phí';
            default:
                return '';
        }
    };

    const getCaseLabel = (caseType: string): string => {
        switch (caseType) {
            case 'CASE1_HAS_INS_HAS_DOC':
                return 'Có bảo hiểm + Có chứng từ';
            case 'CASE2_HAS_INS_NO_DOC':
                return 'Có bảo hiểm + Không chứng từ';
            case 'CASE3_NO_INS_HAS_DOC':
                return 'Không bảo hiểm + Có chứng từ';
            case 'CASE4_NO_INS_NO_DOC':
                return 'Không bảo hiểm + Không chứng từ';
            default:
                return caseType;
        }
    };

    return (
        <Card 
            title={
                <div className="flex items-center gap-2">
                    <DollarOutlined className="text-blue-600" />
                    <span>Thông tin bồi thường hư hại</span>
                    {compensation?.damageCompensationStatus && (
                        <Tag color={getDamageCompensationStatusColor(compensation.damageCompensationStatus as DamageCompensationStatus)}>
                            {getDamageCompensationStatusLabel(compensation.damageCompensationStatus as DamageCompensationStatus)}
                        </Tag>
                    )}
                </div>
            }
            className="shadow-md"
        >
            {/* Customer & Order Info */}
            {issue.sender && (
                <Card size="small" className="mb-4 bg-gray-50">
                    <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} bordered>
                        <Descriptions.Item label={<><ShopOutlined /> Công ty</>}>
                            {issue.sender.companyName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<><UserOutlined /> Người đại diện</>}>
                            {issue.sender.representativeName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<><PhoneOutlined /> Điện thoại</>}>
                            {issue.sender.representativePhone || issue.sender.userResponse?.phoneNumber || '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            )}

            {/* Damage Images */}
            {issue.issueImages && issue.issueImages.length > 0 && (
                <div className="mb-4">
                    <Text strong className="block mb-2">Hình ảnh hư hại:</Text>
                    <Image.PreviewGroup>
                        <div className="flex gap-2 flex-wrap">
                            {issue.issueImages.map((img, idx) => (
                                <Image
                                    key={idx}
                                    src={img}
                                    width={100}
                                    height={100}
                                    style={{ objectFit: 'cover', borderRadius: 8 }}
                                />
                            ))}
                        </div>
                    </Image.PreviewGroup>
                </div>
            )}

            <Divider />

            {/* Insurance Status Alert */}
            <Alert
                type={hasInsurance ? 'success' : 'warning'}
                icon={hasInsurance ? <SafetyCertificateOutlined /> : <WarningOutlined />}
                message={hasInsurance ? 'Đơn hàng có mua bảo hiểm' : 'Đơn hàng KHÔNG có bảo hiểm'}
                description={
                    hasInsurance 
                        ? 'Khách hàng đã mua bảo hiểm vận chuyển. Mức bồi thường phụ thuộc vào việc cung cấp chứng từ hợp lệ.'
                        : 'Khách hàng không mua bảo hiểm. Mức bồi thường tối đa = 10 × Cước phí vận chuyển.'
                }
                showIcon
                className="mb-4"
            />

            {/* Freight Fee Info */}
            <Row gutter={16} className="mb-4">
                <Col xs={24} sm={12} md={8}>
                    <Statistic
                        title={
                            <Tooltip title="Lấy từ hợp đồng (adjustedValue hoặc totalValue)">
                                <span>Cước phí vận chuyển <InfoCircleOutlined /></span>
                            </Tooltip>
                        }
                        value={compensation?.damageFreightFee ?? 0}
                        formatter={(value) => formatCurrency(Number(value))}
                        prefix={<DollarOutlined />}
                    />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Statistic
                        title={
                            <Tooltip title="Giới hạn pháp lý = 10 × Cước phí">
                                <span>Giới hạn pháp lý (10×) <InfoCircleOutlined /></span>
                            </Tooltip>
                        }
                        value={previewValues.legalLimit}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: '#faad14' }}
                    />
                </Col>
            </Row>

            <Divider>Thông tin thẩm định</Divider>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={calculatePreview}
            >
                <Row gutter={16}>
                    {/* Document Status */}
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item
                            name="damageHasDocuments"
                            label={
                                <Tooltip title="Hóa đơn VAT, chứng từ mua bán do khách hàng cung cấp bên ngoài hệ thống">
                                    <span><FileTextOutlined /> Có chứng từ hợp lệ? <InfoCircleOutlined /></span>
                                </Tooltip>
                            }
                            valuePropName="checked"
                        >
                            <Switch 
                                checkedChildren="Có" 
                                unCheckedChildren="Không"
                            />
                        </Form.Item>
                    </Col>

                    {/* Damage Assessment Percent */}
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item
                            name="damageAssessmentPercent"
                            label="Tỷ lệ hư hỏng (%)"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tỷ lệ hư hỏng' },
                                { type: 'number', min: 0, max: 100, message: 'Tỷ lệ phải từ 0-100%' }
                            ]}
                        >
                            <InputNumber
                                min={0}
                                max={100}
                                step={5}
                                style={{ width: '100%' }}
                                addonAfter="%"
                                placeholder="Nhập tỷ lệ hư hỏng"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    {/* Declared Value (when has documents) */}
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="damageDeclaredValue"
                            label={
                                <Tooltip title="Giá trị theo hóa đơn/chứng từ khách hàng cung cấp">
                                    <span>Giá trị khai báo (theo chứng từ) <InfoCircleOutlined /></span>
                                </Tooltip>
                            }
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                                addonAfter="VNĐ"
                                placeholder="Nhập giá trị theo chứng từ"
                            />
                        </Form.Item>
                    </Col>

                    {/* Estimated Market Value (when no documents) */}
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="damageEstimatedMarketValue"
                            label={
                                <Tooltip title="Giá trị ước tính theo giá thị trường khi không có chứng từ">
                                    <span>Giá trị ước tính (theo thị trường) <InfoCircleOutlined /></span>
                                </Tooltip>
                            }
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                                addonAfter="VNĐ"
                                placeholder="Nhập giá trị ước tính"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider>Kết quả tính toán</Divider>

                {/* Calculation Results */}
                {previewValues.compensationCase && (
                    <Alert
                        type="info"
                        icon={<CalculatorOutlined />}
                        message={
                            <Tag color={getDamageCompensationCaseColor(previewValues.compensationCase as any)}>
                                {getCaseLabel(previewValues.compensationCase)}
                            </Tag>
                        }
                        description={getCaseDescription(previewValues.compensationCase)}
                        className="mb-4"
                    />
                )}

                <Row gutter={16} className="mb-4">
                    <Col xs={24} sm={8}>
                        <Statistic
                            title="Thiệt hại ước tính"
                            value={previewValues.estimatedLoss}
                            formatter={(value) => formatCurrency(Number(value))}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Statistic
                            title={
                                <span>
                                    Mức bồi thường theo policy
                                    {previewValues.appliesLegalLimit && (
                                        <Tooltip title="Đã áp dụng giới hạn 10× cước phí">
                                            <WarningOutlined className="ml-1 text-orange-500" />
                                        </Tooltip>
                                    )}
                                </span>
                            }
                            value={previewValues.policyCompensation}
                            formatter={(value) => formatCurrency(Number(value))}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="damageFinalCompensation"
                            label="Số tiền đề xuất chi trả"
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                                addonAfter="VNĐ"
                                placeholder="Mặc định = policy"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Adjust Reason */}
                <Form.Item
                    name="damageAdjustReason"
                    label="Lý do điều chỉnh (nếu khác policy)"
                >
                    <TextArea
                        rows={2}
                        placeholder="Nhập lý do nếu số tiền đề xuất khác với mức bồi thường theo policy"
                    />
                </Form.Item>

                {/* Handler Note */}
                <Form.Item
                    name="damageHandlerNote"
                    label="Ghi chú xử lý nội bộ"
                >
                    <TextArea
                        rows={3}
                        placeholder="Ghi chú nội bộ về quá trình xử lý bồi thường"
                    />
                </Form.Item>

                {/* Compensation Status */}
                <Form.Item
                    name="damageCompensationStatus"
                    label="Trạng thái xử lý"
                >
                    <Select placeholder="Chọn trạng thái">
                        <Select.Option value="PENDING_ASSESSMENT">
                            <Tag color="orange">Chờ thẩm định</Tag>
                        </Select.Option>
                        <Select.Option value="PROPOSED">
                            <Tag color="blue">Đã đề xuất bồi thường</Tag>
                        </Select.Option>
                        <Select.Option value="APPROVED">
                            <Tag color="green">Đã phê duyệt</Tag>
                        </Select.Option>
                        <Select.Option value="REJECTED">
                            <Tag color="red">Từ chối bồi thường</Tag>
                        </Select.Option>
                    </Select>
                </Form.Item>

                {/* Submit Button */}
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={saving}
                        size="large"
                        block
                    >
                        Lưu thông tin bồi thường
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default DamageCompensationDetail;
