import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Radio,
  Input,
  Button,
  Row,
  Col,
  Alert,
  Divider,
  Typography,
  Space,
  Switch,
  Spin,
  Descriptions,
  Table,
  Tag,
  message,
  Skeleton,
  Image,
} from 'antd';
import type { SwitchProps } from 'antd';
import {
  DollarOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  BankOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CalculatorOutlined,
  CloseCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { OrderStatusLabels } from '@/constants/enums';
import type { CompensationDetailResponse, CompensationAssessmentRequest } from '@/models/Compensation';
import type { CompensationBreakdown } from '@/models/Compensation';
import { getCompensationDetail, resolveCompensation, calculateCompensationPreview } from '@/services/compensationService';
import ImageUpload from '@/components/common/ImageUpload';

const { Text, Title } = Typography;
const { TextArea } = Input;

// Đổi màu Switch gian lận: ON = đỏ cảnh báo, OFF = xanh nhạt theo màu logistic
const fraudSwitchStyles: SwitchProps['styles'] = (info: any) => ({
  track: {
    backgroundColor: info.checked ? '#ff4d4f' : '#1890ff1a',
    boxShadow: 'none',
  },
  handle: {
    backgroundColor: '#ffffff',
  },
});

interface DamageResolutionPanelProps {
  issueId: string;
  onSuccess?: () => void;
}

/**
 * Component xử lý bồi thường damage theo chính sách mới
 * - 1 API get đầy đủ thông tin
 * - 1 API submit lưu assessment + refund cùng lúc
 * - Layout 1 field per row
 */
const DamageResolutionPanel: React.FC<DamageResolutionPanelProps> = ({ issueId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Monitor form fields to check if the form is valid
  const formValues = Form.useWatch([], form);
  
  useEffect(() => {
    // Only validate visible fields based on hasDocuments state
    // This prevents requiring estimatedMarketValue when hasDocuments=true and vice versa
    const hasDocs = form.getFieldValue('hasDocuments');
    const isFraudMode = form.getFieldValue('fraudDetected');
    
    let fieldsToValidate: string[] = [];
    
    if (isFraudMode) {
      // When fraud is detected, only validate fraud reason
      fieldsToValidate = ['fraudReason'];
    } else {
      // Normal mode: validate based on hasDocuments
      if (hasDocs === true) {
        // Có chứng từ: chỉ yêu cầu giá trị chứng từ
        fieldsToValidate = ['hasDocuments', 'documentValue', 'damageRate', 'finalCompensation', 'refundAmount', 'bankName', 'accountNumber', 'accountHolderName'];
      } else if (hasDocs === false) {
        // Không có chứng từ: chỉ yêu cầu giá trị thị trường ước tính
        fieldsToValidate = ['hasDocuments', 'estimatedMarketValue', 'damageRate', 'finalCompensation', 'refundAmount', 'bankName', 'accountNumber', 'accountHolderName'];
      } else {
        // Chưa chọn: yêu cầu chọn hasDocuments
        fieldsToValidate = ['hasDocuments'];
      }
    }
    
    form.validateFields(fieldsToValidate, { validateOnly: true })
      .then(() => setIsFormValid(true))
      .catch(() => setIsFormValid(false));
  }, [formValues, form]);
  const [damageDetail, setDamageDetail] = useState<CompensationDetailResponse | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [damageRatePercent, setDamageRatePercent] = useState(0); // lưu dạng % (0-100)
  const [isFraud, setIsFraud] = useState(false); // State riêng để disable form khi gian lận
  const [documentFiles, setDocumentFiles] = useState<any[]>([]);
  const [refundProofFile, setRefundProofFile] = useState<any>(null);
  const [compensationBreakdown, setCompensationBreakdown] = useState<CompensationBreakdown>({
    goodsCompensation: 0,
    freightRefund: 0,
    totalCompensation: 0,
    legalLimit: 0,
    compensationCase: 'PENDING',
    explanation: 'Chưa có thông tin thẩm định'
  });
  const [isCalculatingPreview, setIsCalculatingPreview] = useState(false);
  
  // Ref for debounce timer to cancel previous pending API calls
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  
  
  /**
   * Render detailed calculation formula with actual numbers
   */
  const renderCalculationFormula = () => {
    const values = form.getFieldsValue();
    const hasDocs = values.hasDocuments;
    const baseValue = hasDocs ? values.documentValue : values.estimatedMarketValue;
    const damageRate = values.damageRate || 0;
    
    if (!baseValue || !damageRate || !damageDetail) return null;

    // Calculate helper values for display only (backend is source of truth)
    const goodsComp = compensationBreakdown.goodsCompensation;
    const freightRefund = compensationBreakdown.freightRefund;
    const totalComp = compensationBreakdown.totalCompensation;
    const orderContext = damageDetail.orderContext;
    const actualTransportFee = orderContext.transportFee || 0;
    const packageWeight = orderContext.weight || 0;
    const totalWeight = orderContext.totalWeight || packageWeight || 1;

    return (
      <div style={{ fontSize: 13, lineHeight: '1.8' }}>
        <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
          <Text strong style={{ color: '#1890ff' }}>Nguồn dữ liệu:</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            • Giá trị hàng hóa: {baseValue.toLocaleString()} VNĐ ({hasDocs ? 'chứng từ khách cung cấp' : 'thị trường ước tính'})
            <br />
            • Cước vận chuyển gốc: {actualTransportFee.toLocaleString()} VNĐ (từ đơn hàng vận chuyển)
            <br />
            • Tỷ lệ hư hại: {damageRate}% (đánh giá từ staff)
          </Text>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ color: '#1890ff' }}>Công thức tính toán tổng:</Text>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12 }}>
            {/* Dòng 1: công thức tổng quát cho B_tổng bằng câu chữ */}
            Tổng số tiền bồi thường
            {' '}=
            {' '}min(Giá trị thiệt hại của hàng hóa × Tỷ lệ hư hại,
            {' '}Giới hạn bồi thường theo chính sách)
            {' '}+
            {' '}Cước vận chuyển của đơn hàng × (Trọng lượng kiện hư hỏng / Tổng trọng lượng đơn hàng) × Tỷ lệ hư hại
            <br />
            {/* Dòng 2: thế số chi tiết từ công thức câu chữ bằng số gốc */}
            B_tổng = min(
            {' '}
            {baseValue?.toLocaleString()} × {damageRate}%,
            {' '}
            {compensationBreakdown.compensationCase === 'CASE1_HAS_INS_HAS_DOC'
              ? `${orderContext.declaredValue?.toLocaleString()} VNĐ (giá trị khai báo của hàng hóa)`
              : `Giới hạn 10 × cước = ${compensationBreakdown.legalLimit.toLocaleString()} VNĐ`}
            )
            {' '}+
            {' '}{actualTransportFee.toLocaleString()} × (
            {packageWeight.toLocaleString()} / {totalWeight.toLocaleString()}
            ) × {damageRate}%
            <br />
            {/* Dòng 3: rút gọn thành hai số cộng nhau sau khi áp dụng chính sách */}
            B_tổng = {goodsComp.toLocaleString()} + {freightRefund.toLocaleString()}
            <br />
            {/* Dòng 4: kết quả cuối cùng */}
            B_tổng ={' '}
            <Text style={{ fontSize: 18, color: '#1890ff', fontWeight: 'bold' }}>
              {totalComp.toLocaleString()}
            </Text>{' '}
            VNĐ
          </Text>
        </div>

        {compensationBreakdown.legalLimit > 0 && compensationBreakdown.compensationCase !== 'CASE1_HAS_INS_HAS_DOC' && (
          <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
            <Text strong style={{ color: '#389e0d', fontSize: 12 }}>Giới hạn trách nhiệm:</Text>
            <br />
            <Text style={{ fontSize: 12 }}>
              • Giới hạn: 10 × cước vận chuyển = {compensationBreakdown.legalLimit.toLocaleString()} VNĐ
              <br />
              • Áp dụng: Trường hợp không có bảo hiểm hoặc chứng từ không hợp lệ
            </Text>
          </div>
        )}
      </div>
    );
  };

  // Load damage detail
  useEffect(() => {
    loadDamageDetail();
  }, [issueId, refreshTrigger]);

  const loadDamageDetail = async () => {
    setLoading(true);
    try {
      const data = await getCompensationDetail(issueId);
      setDamageDetail(data);
      console.log(data);
      // Pre-fill form if assessment exists
      if (data.assessment) {
        form.setFieldsValue({
          hasDocuments: data.assessment.hasDocuments,
          documentValue: data.assessment.documentValue,
          // Backend lưu 0.0-1.0, UI hiển thị 0-100
          damageRate: (data.assessment.assessmentRate || 0) * 100,
          staffNotes: data.assessment.staffNotes,
          handlerNotes: data.assessment.handlerNotes,
          finalCompensation: data.assessment.finalCompensation,
          // Refund fields
          refundAmount: data.refundInfo?.refundAmount,
          bankName: data.refundInfo?.bankName,
          accountNumber: data.refundInfo?.accountNumber,
          accountHolderName: data.refundInfo?.accountHolderName,
          transactionCode: data.refundInfo?.transactionCode,
          refundNotes: data.refundInfo?.notes
        });
        setHasDocuments(data.assessment.hasDocuments);
        setDamageRatePercent((data.assessment.assessmentRate || 0) * 100);
        
        // Initialize breakdown from server if available
        if (data.compensationBreakdown) {
          setCompensationBreakdown(data.compensationBreakdown);
        }

        // Validate form ngay sau khi fill dữ liệu cũ
        try {
          await form.validateFields();
          setIsFormValid(true);
        } catch {
          setIsFormValid(false);
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải thông tin damage');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch compensation preview from backend
   * Backend is the single source of truth for calculation
   * IMPORTANT: Always use formValues parameter to avoid stale React state
   */
  const fetchCompensationPreview = async (formValues?: any) => {
    if (!damageDetail) return;
    
    try {
      // Use passed form values or get current values from form (NOT React state)
      const values = formValues || form.getFieldsValue();
      
      // CRITICAL: Use values.damageRate from form instead of damageRatePercent state
      // React state updates are async and may not be ready when this function is called
      const currentDamageRate = values.damageRate ?? 0;
      
      // Skip API call if required values are missing
      if (values.hasDocuments && !values.documentValue) return;
      if (!values.hasDocuments && !values.estimatedMarketValue) return;
      
      // Show loading state for preview calculation
      setIsCalculatingPreview(true);
      
      const breakdown = await calculateCompensationPreview(issueId, {
        hasDocuments: values.hasDocuments ?? false,
        documentValue: values.documentValue,
        estimatedMarketValue: values.estimatedMarketValue,
        assessmentRate: currentDamageRate, // Use form value directly, NOT React state
      });
      
      if (breakdown) {
        setCompensationBreakdown(breakdown);
        
        // Also update damageRatePercent state to keep UI in sync
        setDamageRatePercent(currentDamageRate);
        
        // Auto-fill final compensation and refund amount
        form.setFieldsValue({ 
          finalCompensation: breakdown.totalCompensation,
          refundAmount: breakdown.totalCompensation
        });

        // Auto-generate staff notes & refund notes cùng lúc với preview
        // CRITICAL: Pass breakdown.totalCompensation directly to avoid stale state
        const latestValues = form.getFieldsValue();
        
        const autoStaff = buildAutoDamageStaffNotes({
          ...latestValues,
          hasDocuments: values.hasDocuments,
          documentValue: values.documentValue,
          estimatedMarketValue: values.estimatedMarketValue,
          damageRate: currentDamageRate,
          totalCompensation: breakdown.totalCompensation, // Use fresh API value
        });
        
        const autoRefund = buildAutoRefundNotesFromValues({
          ...latestValues,
          refundAmount: breakdown.totalCompensation,
        });
        
        // Update both notes at the same time
        const notesUpdate: any = {};
        if (autoStaff && autoStaff !== latestValues.staffNotes) {
          notesUpdate.staffNotes = autoStaff;
        }
        if (autoRefund && autoRefund !== latestValues.refundNotes) {
          notesUpdate.refundNotes = autoRefund;
        }
        if (Object.keys(notesUpdate).length > 0) {
          form.setFieldsValue(notesUpdate);
        }

              }
      
    } catch (error: any) {
      console.error('Preview calculation failed:', error);
      message.warning('Không thể tính toán preview. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsCalculatingPreview(false);
    }
  };

  const buildAutoDamageStaffNotes = (values: any): string => {
    if (!damageDetail) return '';

    const orderContext = damageDetail.orderContext;
    if (!orderContext) return '';

    const trackingCode = orderContext.trackingCode || orderContext.orderCode || 'kiện hàng';
    const description = orderContext.packageDescription || orderContext.categoryDescription;
    const hasDocs = values.hasDocuments;
    const baseValue = hasDocs ? values.documentValue : values.estimatedMarketValue;
    const baseLabel = hasDocs
      ? 'giá trị theo chứng từ khách cung cấp'
      : 'giá trị thị trường ước tính do nhân viên thẩm định';
    const damageRateValue = values.damageRate ?? damageRatePercent ?? 0;

    // CRITICAL: Use passed totalCompensation (fresh API value) instead of stale state
    const total = values.totalCompensation ?? compensationBreakdown.totalCompensation ?? 0;

    if (!baseValue || !damageRateValue || !total) {
      return '';
    }

    let notes = `Kiện hàng ${trackingCode} (${description}) được ghi nhận hư hại khoảng ${damageRateValue}% so với trạng thái ban đầu.\n`;
    notes += `Giá trị dùng để thẩm định là ${baseValue.toLocaleString()} VNĐ (${baseLabel}).\n`;
    notes += `Tổng mức bồi thường đề xuất cho kiện hàng này khoảng ${total.toLocaleString()} VNĐ theo chính sách hiện hành.`;

    return notes;
  };

  
  const buildAutoRefundNotesFromValues = (values: any): string => {
    const amount = values.refundAmount;
    if (amount == null || amount === 0) {
      return '';
    }

    const amountText = Number(amount).toLocaleString('vi-VN');
    // Chỉ cần thể hiện nhanh hoàn bao nhiêu tiền và cho việc gì
    return `Hoàn cho khách ${amountText} VNĐ cho bồi thường sự cố hư hỏng hàng hóa.`;
  };

  const handleAutoFillStaffNotes = () => {
    const values = form.getFieldsValue();
    const note = buildAutoDamageStaffNotes(values);
    if (!note) {
      message.warning('Vui lòng nhập đủ thông tin và tính preview trước khi tạo ghi chú đánh giá.');
      return;
    }
    form.setFieldsValue({ staffNotes: note });
  };

  const handleAutoFillRefundNotes = () => {
    const values = form.getFieldsValue();
    const note = buildAutoRefundNotesFromValues(values);
    if (!note) {
      message.warning('Vui lòng nhập số tiền hoàn và thông tin ngân hàng trước khi tạo ghi chú hoàn tiền.');
      return;
    }
    form.setFieldsValue({ refundNotes: note });
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      // When fraud is detected, only fraud reason is needed
      if (values.fraudDetected) {
        const request: CompensationAssessmentRequest = {
          issueId: issueId,
          issueType: 'DAMAGE',
          hasDocuments: values.hasDocuments ?? false, // Ensure false, not null/undefined
          documentValue: values.hasDocuments ? values.documentValue : null,
          estimatedMarketValue: !values.hasDocuments ? values.estimatedMarketValue : null,
          assessmentRate: damageRatePercent / 100, // Convert % to 0.0-1.0 decimal
          finalCompensation: 0, // No compensation for fraud
          staffNotes: values.staffNotes,
          handlerNotes: values.handlerNotes,
          fraudDetected: true,
          fraudReason: values.fraudReason,
          documentFiles: documentFiles.length > 0 ? documentFiles : undefined,
          refundProofFile: refundProofFile
        };
        
        await resolveCompensation(request);
        message.success('Đã đánh dấu gian lận và khóa tài khoản khách hàng');
        // Refetch to show updated data
        setRefreshTrigger(prev => prev + 1);
        onSuccess?.();
        return;
      }
      
      // Normal case (no fraud) - Create refund if refundAmount > 0
      const shouldCreateRefund =
        !values.fraudDetected &&
        typeof values.refundAmount === 'number' &&
        values.refundAmount > 0;

      const request: CompensationAssessmentRequest = {
        issueId: issueId,
        issueType: 'DAMAGE',
        hasDocuments: values.hasDocuments,
        documentValue: values.hasDocuments ? values.documentValue : undefined,
        estimatedMarketValue: !values.hasDocuments ? values.estimatedMarketValue : undefined,
        assessmentRate: damageRatePercent / 100, // Convert % to 0.0-1.0 decimal
        finalCompensation: values.finalCompensation,
        staffNotes: values.staffNotes,
        handlerNotes: values.handlerNotes,
        fraudDetected: false,
        fraudReason: undefined,
        adjustReason: values.adjustReason,
        refund: shouldCreateRefund ? {
          createOrUpdate: true,
          refundAmount: values.refundAmount,
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          accountHolderName: values.accountHolderName,
          transactionCode: values.transactionCode,
          notes: values.refundNotes
        } : undefined,
        documentFiles: documentFiles.length > 0 ? documentFiles : undefined,
        refundProofFile: refundProofFile
      };
      
      await resolveCompensation(request);
      message.success('Đã lưu thông tin bồi thường thành công');
      // Refetch to show updated data
      setRefreshTrigger(prev => prev + 1);
      onSuccess?.();
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi lưu thông tin bồi thường');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    // Update hasDocuments state when radio changes
    if ('hasDocuments' in changedValues) {
      setHasDocuments(changedValues.hasDocuments);
      // Clear the opposite field when switching
      if (changedValues.hasDocuments) {
        form.setFieldsValue({ estimatedMarketValue: undefined });
      } else {
        form.setFieldsValue({ documentValue: undefined });
      }
    }
    
    // Update damageRatePercent when damage rate changes
    if ('damageRate' in changedValues) {
      setDamageRatePercent(changedValues.damageRate || 0);
    }
    
        
    // Auto-fetch preview from backend when relevant fields change
    const relevantFields = ['hasDocuments', 'documentValue', 'estimatedMarketValue', 'damageRate'];
    if (relevantFields.some(field => field in changedValues)) {
      // Cancel previous pending API call to avoid race conditions
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Debounce with proper cancellation - use fresh form values when timer fires
      debounceTimerRef.current = setTimeout(() => {
        // Get fresh form values at execution time to ensure latest data
        const currentValues = form.getFieldsValue();
        fetchCompensationPreview(currentValues);
      }, 500); // Increased to 500ms for better UX
    }
    
    // Only validate visible fields to avoid conflicts with conditional rendering
    const visibleFields = hasDocuments ? ['documentValue', 'damageRate'] : ['estimatedMarketValue', 'damageRate'];
    form
      .validateFields(visibleFields)
      .then(() => setIsFormValid(true))
      .catch(() => setIsFormValid(false));
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!damageDetail) {
    return (
      <Card>
        <Alert type="error" message="Không tìm thấy thông tin damage" />
      </Card>
    );
  }

  const { orderContext, policyInfo, assessment, refundInfo } = damageDetail;
  const hasInsurancePolicy = orderContext.hasInsurance;
  const hasAssessment = !!assessment;
  const hasRefundInfo = !!refundInfo;
  // View-only khi đã có thẩm định; thẻ hoàn tiền chỉ hiển thị nếu có refundInfo
  const isResolvedView = hasAssessment;

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('vi-VN');
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-blue-600" />
          <span>Xử lý bồi thường hư hại</span>
        </div>
      }
      className="shadow-md"
    >

      <Divider>Thông tin hệ thống</Divider>

      {/* System Info (Readonly) */}
      <Card size="small" className="mb-4 bg-gray-50">
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="Mã đơn hàng">{orderContext.orderCode}</Descriptions.Item>
          <Descriptions.Item label="Khách hàng">
            {orderContext.customerName} - {orderContext.customerPhone}
          </Descriptions.Item>
          <Descriptions.Item label="Cước phí vận chuyển">
            <Text strong className="text-blue-600">
              {orderContext.transportFee?.toLocaleString()} VNĐ
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Giá trị khai báo">
            <Text strong>{orderContext.declaredValue?.toLocaleString()} VNĐ</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Loại hàng">{orderContext.categoryDescription}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái bảo hiểm">
            {orderContext.hasInsurance ? (
              <Text type="success">
                <SafetyCertificateOutlined /> Đã mua bảo hiểm {orderContext.categoryDescription?.toLowerCase()}
              </Text>
            ) : (
              <Text type="warning">Không mua bảo hiểm</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Giới hạn bồi thường tối đa (nếu không chứng từ)">
            <Text type="warning">
              {policyInfo.maxCompensationWithoutDocs?.toLocaleString()} VNĐ (10× cước phí)
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Damaged Package Info - table UI giống OffRoute packages card */}
      <Card
        title={
          <Space>
            <InboxOutlined style={{ color: '#722ed1', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>Chi tiết các kiện hàng trong chuyến xe</span>
          </Space>
        }
        bordered={false}
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderTop: '3px solid #722ed1',
        }}
        extra={
          <div
            style={{
              background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
              padding: '8px 16px',
              borderRadius: '6px',
            }}
          >
            <Text strong style={{ color: 'white', fontSize: 14 }}>
              Tổng giá trị: {orderContext.declaredValue?.toLocaleString()} đ
            </Text>
          </div>
        }
        className="mb-4"
      >
        <Table
          columns={[
            {
              title: 'Mã tracking',
              dataIndex: 'trackingCode',
              key: 'trackingCode',
              render: (text: string) => <Text strong copyable>{text}</Text>,
            },
            {
              title: 'Mô tả',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
            },
            {
              title: 'Khối lượng',
              dataIndex: 'weight',
              key: 'weight',
              render: (value: string | number | undefined) => (
                <span>{value ? `${value} Tấn` : '-'}</span>
              ),
            },
            {
              title: 'Giá trị khai báo',
              dataIndex: 'declaredValue',
              key: 'declaredValue',
              align: 'right' as const,
              render: (value: number) => (
                <Text strong style={{ color: '#1890ff' }}>
                  {value?.toLocaleString()} đ
                </Text>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              key: 'status',
              render: (value: string) => (
                <Tag color={value === 'DELIVERED' ? 'green' : value === 'IN_TRANSIT' ? 'blue' : 'orange'}>
                  {OrderStatusLabels[value as keyof typeof OrderStatusLabels] || value}
                </Tag>
              ),
            },
          ]}
          dataSource={[
            {
              key: orderContext.orderDetailId || orderContext.orderId,
              trackingCode: orderContext.trackingCode || orderContext.orderCode,
              description: orderContext.packageDescription || orderContext.categoryDescription,
              weight: orderContext.weight?.toString(),
              declaredValue: Number(orderContext.declaredValue || 0),
              status: orderContext.orderDetailStatus,
            },
          ]}
          pagination={false}
          size="middle"
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>Tổng cộng (1 kiện)</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#722ed1', fontSize: 16 }}>
                    {orderContext.declaredValue?.toLocaleString()} đ
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* Issue Evidence Images - Hình ảnh hư hại */}
      {damageDetail?.evidenceImages && damageDetail.evidenceImages.length > 0 && (
        <Card
          title={
            <Space>
              <CameraOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Hình ảnh hư hại của sự cố</span>
            </Space>
          }
          bordered={false}
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderTop: '3px solid #ff4d4f',
          }}
          className="mb-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Image.PreviewGroup>
              {damageDetail.evidenceImages.map((url: string, idx: number) => (
                <Image
                  key={idx}
                  src={url}
                  alt={`Hình ảnh hư hại ${idx + 1}`}
                  className="rounded"
                  width="100%"
                  style={{ maxHeight: '200px', objectFit: 'cover' }}
                />
              ))}
            </Image.PreviewGroup>
          </div>
        </Card>
      )}

      {/* Policy Description - Only show when available */}
      {policyInfo?.policyDescription && (
        <Alert
          type={hasInsurancePolicy ? 'success' : 'warning'}
          icon={hasInsurancePolicy ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
          message={
            <span style={{ fontWeight: 600 }}>
              {hasInsurancePolicy ? '✅ Đơn hàng có bảo hiểm' : '⚠️ Đơn hàng KHÔNG có bảo hiểm'}
            </span>
          }
          description={
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 8, lineHeight: 1.6 }}>
                {policyInfo.policyDescription}
              </div>
              <div style={{ 
                background: hasInsurancePolicy ? '#f6ffed' : '#fffbe6', 
                padding: '8px 12px', 
                borderRadius: 6,
                border: hasInsurancePolicy ? '1px solid #b7eb8f' : '1px solid #ffe58f'
              }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  <strong>Giới hạn tối đa (nếu không chứng từ):</strong>{' '}
                  <Text type="warning" style={{ fontWeight: 600 }}>
                    {policyInfo.maxCompensationWithoutDocs?.toLocaleString()} VNĐ
                  </Text>
                  <span style={{ marginLeft: 8, color: '#8c8c8c' }}>(10× cước phí)</span>
                </Text>
              </div>
            </div>
          }
          className="mb-4"
          showIcon
          style={{ 
            borderLeft: hasInsurancePolicy ? '4px solid #52c41a' : '4px solid #faad14'
          }}
        />
      )}

      <Divider>Thông tin thẩm định</Divider>

      {isResolvedView ? (
        <>
          {/* Trạng thái gian lận */}
          {assessment?.fraudDetected ? (
            <Alert
              type="error"
              showIcon
              message="Sự cố đã được đánh dấu GIAN LẬN"
              description={assessment.fraudReason || 'Không có lý do chi tiết'}
              style={{ marginBottom: 16, border: '2px solid #ff4d4f', background: '#fff2f0' }}
            />
          ) : (
            <Tag color="green" style={{ marginBottom: 16 }}>
              Xử lý hợp lệ - Không gian lận
            </Tag>
          )}

          {/* Two-column layout for Assessment and Refund - Hide when fraud detected */}
          {assessment && !assessment.fraudDetected && (
          <Row gutter={16}>
            {/* Assessment Column */}
            <Col xs={24} lg={refundInfo ? 12 : 24}>
              <Card
                size="small"
                title={
                  <Space>
                    <DollarOutlined style={{ color: '#1890ff' }} />
                    <span>Kết quả thẩm định bồi thường</span>
                  </Space>
                }
                style={{
                  borderTop: '3px solid #1890ff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  height: '100%'
                }}
              >
                {/* Hình ảnh chứng từ khách hàng cung cấp */}
                {(() => {
                  console.log('Rendering document images section...');
                  console.log('assessment exists:', !!assessment);
                  console.log('assessment.documentImages:', assessment?.documentImages);
                  console.log('isArray:', Array.isArray(assessment?.documentImages));
                  console.log('length:', assessment?.documentImages?.length);
                  
                  if (assessment?.documentImages && Array.isArray(assessment.documentImages) && assessment.documentImages.length > 0) {
                    console.log('Will render images:', assessment.documentImages.length);
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                          Hình ảnh chứng từ khách hàng
                        </Text>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <Image.PreviewGroup>
                            {assessment.documentImages.map((img: string, idx: number) => (
                              <Image
                                key={idx}
                                src={img.trim()}
                                alt={`Chứng từ ${idx + 1}`}
                                className="rounded"
                                width="100%"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                                onError={(e) => {
                                  console.error('Image failed to load:', img.trim(), e);
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', img.trim());
                                }}
                              />
                            ))}
                          </Image.PreviewGroup>
                        </div>
                      </div>
                    );
                  }
                  console.log('Not rendering images - condition not met');
                  return null;
                })()}

                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Mã thẩm định">
                    <Text copyable>{assessment?.assessmentId || '-'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Có chứng từ">
                    <Tag color={assessment?.hasDocuments ? 'green' : 'orange'}>
                      {assessment?.hasDocuments ? 'Có' : 'Không'}
                    </Tag>
                  </Descriptions.Item>
                  {assessment?.hasDocuments && assessment?.documentValue != null && (
                    <Descriptions.Item label="Giá trị theo chứng từ">
                      <Text strong>{assessment.documentValue.toLocaleString()} VNĐ</Text>
                    </Descriptions.Item>
                  )}
                  {!assessment?.hasDocuments && assessment?.estimatedMarketValue != null && (
                    <Descriptions.Item label="Giá trị thị trường ước tính">
                      <Text>{assessment.estimatedMarketValue.toLocaleString()} VNĐ</Text>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Tỷ lệ hư hại">
                    <Tag color="blue">
                      {assessment?.assessmentRatePercent || `${((assessment?.assessmentRate || 0) * 100).toFixed(0)}%`}
                    </Tag>
                  </Descriptions.Item>
                  {assessment?.compensationByPolicy != null && (
                    <Descriptions.Item label="Bồi thường theo chính sách">
                      {assessment.compensationByPolicy.toLocaleString()} VNĐ
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Mức chi trả cuối cùng">
                    <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                      {assessment?.finalCompensation?.toLocaleString()} VNĐ
                    </Text>
                  </Descriptions.Item>
                  {assessment?.adjustReason && (
                    <Descriptions.Item label="Lý do điều chỉnh">
                      <Text type="warning">{assessment.adjustReason}</Text>
                    </Descriptions.Item>
                  )}
                  {assessment?.staffNotes && (
                    <Descriptions.Item label="Ghi chú đánh giá">
                      {assessment.staffNotes}
                    </Descriptions.Item>
                  )}
                  {assessment?.handlerNotes && (
                    <Descriptions.Item label="Ghi chú xử lý">
                      {assessment.handlerNotes}
                    </Descriptions.Item>
                  )}
                  {assessment?.createdByName && (
                    <Descriptions.Item label="Tạo bởi">
                      {assessment.createdByName}
                    </Descriptions.Item>
                  )}
                  {assessment?.createdAt && (
                    <Descriptions.Item label="Thời gian tạo">
                      {formatDateTime(assessment.createdAt)}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>

            {/* Refund Column */}
            {refundInfo && (
              <Col xs={24} lg={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <BankOutlined style={{ color: '#52c41a' }} />
                      <span>Thông tin hoàn tiền</span>
                    </Space>
                  }
                  style={{
                    borderTop: '3px solid #52c41a',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    height: '100%'
                  }}
                >
                  {/* Refund proof image at top if exists */}
                  {refundInfo.bankTransferImage && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Ảnh chứng minh hoàn tiền
                      </Text>
                      <Image.PreviewGroup>
                        <Image
                          src={refundInfo.bankTransferImage}
                          width={100}
                          height={100}
                          style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9' }}
                        />
                      </Image.PreviewGroup>
                    </div>
                  )}

                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Mã hoàn tiền">
                      <Text copyable>{refundInfo.refundId || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số tiền hoàn">
                      <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                        {refundInfo.refundAmount?.toLocaleString()} VNĐ
                      </Text>
                    </Descriptions.Item>
                    {refundInfo.bankName && (
                      <Descriptions.Item label="Ngân hàng">
                        {refundInfo.bankName}
                      </Descriptions.Item>
                    )}
                    {refundInfo.accountNumber && (
                      <Descriptions.Item label="Số tài khoản">
                        <Text copyable>{refundInfo.accountNumber}</Text>
                      </Descriptions.Item>
                    )}
                    {refundInfo.accountHolderName && (
                      <Descriptions.Item label="Chủ tài khoản">
                        {refundInfo.accountHolderName}
                      </Descriptions.Item>
                    )}
                    {refundInfo.transactionCode && (
                      <Descriptions.Item label="Mã giao dịch">
                        <Text copyable style={{ color: '#1890ff' }}>{refundInfo.transactionCode}</Text>
                      </Descriptions.Item>
                    )}
                    {refundInfo.notes && (
                      <Descriptions.Item label="Ghi chú hoàn tiền">
                        {refundInfo.notes}
                      </Descriptions.Item>
                    )}
                    {refundInfo.refundDate && (
                      <Descriptions.Item label="Ngày hoàn tiền">
                        {formatDateTime(refundInfo.refundDate)}
                      </Descriptions.Item>
                    )}
                    {refundInfo.processedByStaffName && (
                      <Descriptions.Item label="Xử lý bởi">
                        {refundInfo.processedByStaffName}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
            )}
          </Row>
          )}
        </>
      ) : (
      <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleFormValuesChange} className="mt-4">
        {/* Fraud Detection Switch - Top of form */}
        <Alert
          message="Phát hiện gian lận"
          description={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <InfoCircleOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                <span style={{ fontWeight: 600 }}>Đánh dấu trường hợp gian lận</span>
              </div>
              <Form.Item
                name="fraudDetected"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  size="small"
                  checkedChildren="1"
                  unCheckedChildren="0"
                  styles={fraudSwitchStyles}
                  onChange={(checked) => {
                    setIsFraud(checked); // Cập nhật state để disable form ngay lập tức
                    if (checked) {
                      // Clear all non-fraud fields when fraud is detected
                      form.setFieldsValue({
                        hasDocuments: false,
                        documentValue: null,
                        estimatedMarketValue: null,
                        damageRate: 0,
                        staffNotes: undefined,
                        finalCompensation: 0,
                        refundAmount: null,
                        bankName: undefined,
                        accountNumber: undefined,
                        accountHolderName: undefined,
                        transactionCode: undefined,
                        bankTransferImage: undefined,
                        refundNotes: undefined,
                      });
                    }
                  }}
                />
              </Form.Item>
            </div>
          }
          type={isFraud ? 'error' : 'info'}
          showIcon
          className="mb-2"
        />

        {/* Lý do gian lận: chỉ hiển thị khi đã bật switch */}
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.fraudDetected !== curr.fraudDetected}
        >
          {({ getFieldValue }) =>
            getFieldValue('fraudDetected') ? (
              <Form.Item
                name="fraudReason"
                label="Lý do đánh dấu gian lận"
                rules={[{ required: true, message: 'Vui lòng nhập lý do đánh dấu gian lận' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Mô tả rõ lý do nghi ngờ/khẳng định gian lận, dùng cho kiểm soát nội bộ"
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        {/* Fraud Warning Banner */}
        {isFraud && (
          <Alert
            message="⚠️ ĐÁNH DẤU GIAN LẬN - KHÓA TÀI KHOẢN KHÁCH HÀNG"
            description="Sự cố này sẽ bị đóng với trạng thái GIAN LẬN. Tài khoản khách hàng sẽ bị khóa. Không cần xử lý bồi thường."
            type="error"
            showIcon
            className="mb-4"
            style={{ border: '2px solid #ff4d4f', backgroundColor: '#fff2f0' }}
          />
        )}

        {/* Hide all forms when fraud is detected */}
        {!isFraud && (
          <>
        {/* Has Documents */}
        <Form.Item
          name="hasDocuments"
          label="Khách hàng có cung cấp chứng từ hợp lệ?"
          rules={[{ required: true, message: 'Vui lòng chọn' }]}
        >
          <Radio.Group disabled={isFraud}>
            <Radio value={true}>
              <FileTextOutlined /> Có chứng từ
            </Radio>
            <Radio value={false}>Không có chứng từ</Radio>
          </Radio.Group>
        </Form.Item>

        {/* Value Input - Document or Market Value (Consolidated to avoid empty space) */}
        <Form.Item
          shouldUpdate={(prevValues, currentValues) => prevValues.hasDocuments !== currentValues.hasDocuments}
        >
          {({ getFieldValue }) => {
            const hasDocs = getFieldValue('hasDocuments');
            const showField = !isFraud;
            
            if (!showField) return null;
            
            // Chỉ hiển thị field tương ứng khi đã chọn hasDocuments
            if (hasDocs === true) {
              // Có chứng từ: chỉ hiển thị documentValue
              return (
                <>
                  <Form.Item
                    name="documentValue"
                    label="Giá trị theo chứng từ (VNĐ)"
                    rules={[
                      { required: true, message: 'Vui lòng nhập giá trị chứng từ' },
                      { type: 'number', min: 1, message: 'Giá trị chứng từ phải lớn hơn 0' }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      formatter={(value) => {
                        if (value == null) return '';
                        return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      }}
                      parser={(value) => {
                        if (!value || value === '') return undefined;
                        const parsed = value?.replace(/\$\s?|(,*)/g, '');
                        return (parsed ? parseInt(parsed, 10) : undefined) as any;
                      }}
                      addonAfter="VNĐ"
                      placeholder="Nhập giá trị theo chứng từ khách cung cấp"
                    />
                  </Form.Item>
                  <Text type="secondary" style={{ display: 'block', marginTop: -16, marginBottom: 16 }}>
                    Nếu chứng từ thấp hơn khai báo: bồi thường theo chứng từ. Nếu chứng từ cao hơn khai báo: bồi thường tối đa theo giá trị khai báo.
                  </Text>
                </>
              );
            } else if (hasDocs === false) {
              // Không có chứng từ: chỉ hiển thị estimatedMarketValue
              return (
                <Form.Item
                  name="estimatedMarketValue"
                  label="Giá trị thị trường ước tính (VNĐ)"
                  rules={[
                    { required: true, message: 'Vui lòng nhập giá trị thị trường ước tính' },
                    { type: 'number', min: 1, message: 'Giá trị thị trường phải lớn hơn 0' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    formatter={(value) => {
                      if (value == null) return '';
                      return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    }}
                    parser={(value) => {
                      if (!value || value === '') return undefined;
                      const parsed = value?.replace(/\$\s?|(,*)/g, '');
                      return (parsed ? parseInt(parsed, 10) : undefined) as any;
                    }}
                    addonAfter="VNĐ"
                    placeholder="Giá trị ước tính theo thị trường khi không có chứng từ"
                  />
                </Form.Item>
              );
            }
            
            // Chưa chọn hasDocuments: không hiển thị field nào
            return null;
          }}
        </Form.Item>

        {/* Damage Rate */}
        <Form.Item
          name="damageRate"
          label="Tỷ lệ hư hại (%)"
          rules={[
            { required: !isFraud, message: 'Vui lòng nhập tỷ lệ hư hại' },
            { type: 'number', min: 0, max: 100, message: 'Tỷ lệ phải từ 0 đến 100' }
          ]}
        >
          <InputNumber
            min={0}
            max={100}
            step={1}
            style={{ width: '100%' }}
            placeholder="Ví dụ: 50 = 50% hư hại"
            addonAfter="%"
            disabled={isFraud}
          />
        </Form.Item>

        {/* Staff Notes - tự động sinh nội dung trong handleFormValuesChange */}
        <Form.Item 
          name="staffNotes" 
          label="Ghi chú đánh giá"
        >
          <TextArea 
            rows={3} 
            placeholder="Mô tả chi tiết về tình trạng hư hại" 
            disabled={isFraud}
          />
        </Form.Item>

        <Divider>Kết quả tính toán bồi thường</Divider>

        {/* Compensation Breakdown Preview */}
        <Card 
          title={
            <>
              <CalculatorOutlined className="mr-2" />
              Preview Bồi thường
            </>
          }
          size="small"
          className="mb-4"
        >
          <Row gutter={16}>
              <Col span={8}>
                <div className="text-center">
                  <Text type="secondary">Bồi thường hàng hóa (B_hàng)</Text>
                  <div className="text-xl font-bold text-green-600">
                    {isCalculatingPreview ? (
                      <Skeleton.Input 
                        active 
                        size="small" 
                        style={{ width: 120, height: 28 }} 
                      />
                    ) : (
                      `${compensationBreakdown.goodsCompensation.toLocaleString()} VNĐ`
                    )}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <Text type="secondary">Hoàn cước Pro-rata (C_hư)</Text>
                  <div className="text-xl font-bold text-orange-500">
                    {isCalculatingPreview ? (
                      <Skeleton.Input 
                        active 
                        size="small" 
                        style={{ width: 120, height: 28 }} 
                      />
                    ) : (
                      `${compensationBreakdown.freightRefund.toLocaleString()} VNĐ`
                    )}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <Text type="secondary">Tổng bồi thường (B_tổng)</Text>
                  <div className="text-2xl font-bold text-blue-600">
                    {isCalculatingPreview ? (
                      <Skeleton.Input 
                        active 
                        size="small" 
                        style={{ width: 140, height: 32 }} 
                      />
                    ) : (
                      `${compensationBreakdown.totalCompensation.toLocaleString()} VNĐ`
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          
          {/* Legal limit warning for non-insured cases */}
          {compensationBreakdown.compensationCase !== 'CASE1_HAS_INS_HAS_DOC' && compensationBreakdown.legalLimit > 0 && (
            <Alert
              type="warning"
              message={`Giới hạn trách nhiệm: ${compensationBreakdown.legalLimit.toLocaleString()} VNĐ (10 × cước vận chuyển)`}
              className="mt-3"
              showIcon
            />
          )}
          
          {/* Explanation */}
          <div className="mt-3 p-2 bg-white rounded">
            <Text type="secondary" style={{ fontSize: 12 }}>
              <InfoCircleOutlined className="mr-1" />
              {compensationBreakdown.explanation}
            </Text>
          </div>
        </Card>
        
        {/* Final compensation input */}
        <Card 
          size="small" 
          style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #1890ff',
            marginBottom: 16
          }}
        >
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                💰 Số tiền đề xuất chi trả
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                (Tự động tính toán)
              </Text>
            </Col>
            <Col span={18}>
              <Form.Item
                name="finalCompensation"
                style={{ marginBottom: 0 }}
                rules={[{ required: !isFraud, message: 'Vui lòng nhập số tiền đề xuất' }]}
              >
                <InputNumber
                  min={0}
                  style={{ 
                    width: '100%',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textAlign: 'right',
                    backgroundColor: '#ffffff',
                    borderColor: '#1890ff'
                  }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  addonAfter="VNĐ"
                  placeholder={`${compensationBreakdown.totalCompensation.toLocaleString()}`}
                  disabled={isFraud}
                  readOnly={true}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Calculation Formula Display */}
        {!isFraud && compensationBreakdown.compensationCase !== 'PENDING' && (
          <Card 
            size="small" 
            style={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #1890ff',
              marginBottom: 16
            }}
          >
            <Text strong style={{ color: '#1890ff', marginBottom: 8, display: 'block' }}>
              📊 Công thức tính toán chi tiết:
            </Text>
            <div style={{ fontSize: 13, lineHeight: '1.6' }}>
              {renderCalculationFormula()}
            </div>
          </Card>
        )}

        {/* Adjustment Reason Field - only show when staff chỉnh khác với preview */}
        <Form.Item
          noStyle
          shouldUpdate={(prev, current) => prev.finalCompensation !== current.finalCompensation}
        >
          {({ getFieldValue }) => {
            const finalComp = getFieldValue('finalCompensation');
            const previewTotal = compensationBreakdown.totalCompensation;

            const shouldShowAdjustReason =
              !isFraud &&
              typeof finalComp === 'number' &&
              typeof previewTotal === 'number' &&
              finalComp !== previewTotal;

            if (!shouldShowAdjustReason) {
              return null;
            }

            return (
              <Form.Item
                name="adjustReason"
                label="Lý do điều chỉnh (nếu có)"
                help="Ghi rõ lý do nếu điều chỉnh khác với số tiền tự động tính toán"
              >
                <TextArea
                  rows={2}
                  placeholder="Ví dụ: Khách hàng có giấy tờ đặc biệt, áp dụng chính sách ưu đãi..."
                  disabled={isFraud}
                />
              </Form.Item>
            );
          }}
        </Form.Item>

        {/* Customer Documents Section */}
        <Divider titlePlacement="start" style={{ margin: '24px 0 16px 0' }}>
          <Space>
            <InboxOutlined style={{ color: '#1890ff' }} />
            <span>Chứng từ khách hàng cung cấp</span>
          </Space>
        </Divider>
        
        <Form.Item
          label="Tải lên chứng từ khách hàng"
          help="Hóa đơn, biên nhận, hình ảnh hàng hóa mà khách hàng đã cung cấp"
        >
          <ImageUpload
            value={documentFiles}
            onChange={setDocumentFiles}
            maxCount={10}
            title="Chứng từ khách hàng"
            description="Tối đa 10 ảnh, định dạng JPG/PNG, mỗi ảnh tối đa 10MB"
          />
        </Form.Item>

        {/* Handler notes - ghi chú xử lý nghiệp vụ, optional */}
        <Form.Item
          name="handlerNotes"
          label="Ghi chú xử lý (handler)"
        >
          <TextArea
            rows={3}
            placeholder="Ghi chú nội bộ về cách xử lý bồi thường, liên hệ với khách hàng/tài xế (không bắt buộc)"
            disabled={isFraud}
          />
        </Form.Item>

        <Divider>Thông tin hoàn tiền</Divider>

        <Card 
          size="small" 
          style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #1890ff',
            marginBottom: 16
          }}
        >
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                💸 Số tiền hoàn
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                (Nhập thủ công)
              </Text>
            </Col>
            <Col span={18}>
              <Form.Item
                name="refundAmount"
                style={{ marginBottom: 0 }}
                rules={[{ required: !isFraud, message: 'Vui lòng nhập số tiền hoàn' }]}
              >
                <InputNumber
                  min={0}
                  style={{ 
                    width: '100%',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textAlign: 'right',
                    backgroundColor: '#ffffff',
                    borderColor: '#1890ff'
                  }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  addonAfter="VNĐ"
                  placeholder="Nhập số tiền đã hoàn cho khách"
                  disabled={isFraud}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          {/* Cột trái: toàn bộ input text */}
          <Col xs={24} sm={16}>
            <Form.Item
              name="bankName"
              label="Tên ngân hàng"
              rules={[{ required: !isFraud, message: 'Vui lòng nhập tên ngân hàng' }]}
            >
              <Input placeholder="VD: Vietcombank, Techcombank" disabled={isFraud} />
            </Form.Item>

            <Form.Item
              name="accountNumber"
              label="Số tài khoản"
              rules={[{ required: !isFraud, message: 'Vui lòng nhập số tài khoản' }]}
            >
              <Input placeholder="Nhập số tài khoản nhận tiền" disabled={isFraud} />
            </Form.Item>

            <Form.Item
              name="accountHolderName"
              label="Chủ tài khoản"
              rules={[{ required: !isFraud, message: 'Vui lòng nhập tên chủ tài khoản' }]}
            >
              <Input placeholder="Tên đầy đủ của chủ tài khoản" disabled={isFraud} />
            </Form.Item>

            <Form.Item
              name="transactionCode"
              label="Mã giao dịch"
            >
              <Input placeholder="Mã giao dịch chuyển khoản (nếu có)" disabled={isFraud} />
            </Form.Item>

            <Form.Item
              name="refundNotes"
              label="Ghi chú hoàn tiền"
            >
              <TextArea rows={3} placeholder="Ghi chú thêm về quá trình hoàn tiền" disabled={isFraud} />
            </Form.Item>
          </Col>

          {/* Cột phải: upload ảnh chứng minh hoàn tiền */}
          <Col xs={24} sm={8}>
            <Form.Item
              label="Ảnh chứng minh hoàn tiền"
              help="Tải lên ảnh biên lai chuyển tiền hoặc bằng chứng hoàn tiền"
            >
              <ImageUpload
                value={refundProofFile ? [refundProofFile] : []}
                onChange={(files) => setRefundProofFile(files[0] || null)}
                maxCount={1}
                description="Tối đa 1 ảnh, định dạng JPG/PNG"
              />
            </Form.Item>
          </Col>
        </Row>

        
          </>
        )}

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SaveOutlined />}
            block
            style={{
              background: isFraud ? '#ff4d4f' : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
              height: '40px',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {submitting 
              ? 'Đang lưu...' 
              : isFraud 
                ? 'Đánh dấu gian lận và khóa tài khoản' 
                : 'Lưu thông tin bồi thường'
            }
          </Button>
        </Form.Item>
      </Form>
      )}
    </Card>
  );
};

export default DamageResolutionPanel;
