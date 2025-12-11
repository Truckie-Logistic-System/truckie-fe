import React, { useState, useEffect, useRef } from 'react';
import {
    Card,
    Table,
    Tag,
    Typography,
    Spin,
    Skeleton,
    Row,
    Col,
    Space,
    Divider,
    Alert,
    Statistic,
    App,
    Button,
    message,
    Form,
    InputNumber,
    Radio,
    Input,
    Checkbox,
    Switch,
    Image,
    Descriptions,
} from 'antd';
import ImageUpload from '@/components/common/ImageUpload';
import type { SwitchProps } from 'antd';
import {
    WarningOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    PhoneOutlined,
    UserOutlined,
    HomeOutlined,
    InboxOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    SaveOutlined,
    ExclamationCircleOutlined,
    BankOutlined,
    CameraOutlined,
} from '@ant-design/icons';
import type { Issue } from '@/models/Issue';
import { OrderStatusLabels } from '@/constants/enums';
import issueService, { type OffRouteRunawayDetail as OffRouteRunawayDetailType, type PackageInfo } from '@/services/issue/issueService';
import type { OffRouteEvent } from '@/models/OffRouteEvent';
import type { CompensationDetailResponse, CompensationAssessmentRequest } from '@/models/Compensation';
import { resolveCompensation, calculateCompensationPreview, getCompensationDetail } from '@/services/compensationService';
import ContactConfirmationModal from './ContactConfirmationModal';
import GracePeriodExtensionModal from './GracePeriodExtensionModal';
import GracePeriodCountdown from './GracePeriodCountdown';

const { Title, Text } = Typography;

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

interface OffRouteRunawayDetailProps {
    issue: Issue;
    onUpdate: (updatedIssue: Issue) => void;
    onAssessmentSaved?: () => void;
}

const OffRouteRunawayDetail: React.FC<OffRouteRunawayDetailProps> = ({ issue, onUpdate, onAssessmentSaved }) => {
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<OffRouteRunawayDetailType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [offRouteEvent, setOffRouteEvent] = useState<OffRouteEvent | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [showGracePeriodModal, setShowGracePeriodModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<OffRouteEvent | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [form] = Form.useForm();
    const [hasDocuments, setHasDocuments] = useState<boolean>(true);
    const [suggestedCompensationPreview, setSuggestedCompensationPreview] = useState<number>(0);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    
    // Monitor form fields to check if the form is valid
    const formValues = Form.useWatch([], form);
    
    useEffect(() => {
        form.validateFields({ validateOnly: true })
            .then(() => setIsFormValid(true))
            .catch(() => setIsFormValid(false));
    }, [formValues, form]);
    const [documentFiles, setDocumentFiles] = useState<any[]>([]);
    const [refundProofFile, setRefundProofFile] = useState<any>(null);
    const [compDetail, setCompDetail] = useState<CompensationDetailResponse | null>(null);

    // Compensation breakdown for OFF_ROUTE (always full loss)
    interface OffRouteBreakdown {
        goodsCompensation: number;
        freightRefund: number;
        totalCompensation: number;
        explanation: string;
    }
    const [compensationBreakdown, setCompensationBreakdown] = useState<OffRouteBreakdown>({
        goodsCompensation: 0,
        freightRefund: 0,
        totalCompensation: 0,
        explanation: 'Lỗi cố ý: Bồi thường 100% giá trị hàng + 100% cước, KHÔNG áp dụng giới hạn 10× cước'
    });
    const [isCalculatingPreview, setIsCalculatingPreview] = useState(false);

    // Ref for debounce timer to cancel previous pending API calls
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Mock staff ID - in real app, get from auth context
    const staffId = 'staff-123';

    // Handler functions for modals
    const handleContactSuccess = () => {
        setShowContactModal(false);
        setSelectedEvent(null);
    };

    const handleGracePeriodSuccess = () => {
        setShowGracePeriodModal(false);
        setSelectedEvent(null);
    };

    useEffect(() => {
        loadDetail();
    }, [issue.id, refreshTrigger]);

    // Initialize form with existing assessment data when detail loads
    useEffect(() => {
        if (detail?.assessment) {
            const assessment = detail.assessment;
            form.setFieldsValue({
                hasDocuments: assessment.hasDocuments,
                documentValue: assessment.documentValue,
                estimatedMarketValue: assessment.estimatedMarketValue,
                suggestedCompensation: assessment.finalCompensation,
                adjustReason: assessment.adjustReason,
                handlerNotes: assessment.handlerNotes,
                fraudDetected: assessment.fraudDetected ?? false,
                fraudReason: assessment.fraudReason
            });
            setHasDocuments(assessment.hasDocuments);
            setSuggestedCompensationPreview(assessment.compensationByPolicy);
        } else {
            // Set default values for new assessment (100% thiệt hại mặc định)
            form.setFieldsValue({
                hasDocuments: true
            });
            setHasDocuments(true);
        }
    }, [detail, form]);

    const loadDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const [detailData, compData] = await Promise.all([
                issueService.getOffRouteRunawayDetail(issue.id),
                getCompensationDetail(issue.id).catch(() => null as CompensationDetailResponse | null),
            ]);
            setDetail(detailData);
            if (compData) {
                setCompDetail(compData);
            }

            // Fetch off-route event details if available
            if (detailData.offRouteEventInfo?.eventId) {
                try {
                    const eventData = await issueService.getOffRouteEventById(detailData.offRouteEventInfo.eventId);
                    setOffRouteEvent(eventData);
                } catch (eventError) {
                    console.error('Error fetching off-route event:', eventError);
                    // Don't fail the whole load if event fetch fails
                }
            }
        } catch (err: any) {
            setError(err.message || 'Không thể tải chi tiết sự cố');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Hiển thị công thức tổng quát cho OFF_ROUTE với số thực tế từ preview
     * B_tổng = B_hàng (100% giá trị hàng) + C_hư (100% cước vận chuyển)
     */
    const renderOffRouteFormula = () => {
        if (!detail) return null;

        const goodsComp = compensationBreakdown.goodsCompensation || 0;
        const freightRefund = compensationBreakdown.freightRefund || 0;
        const totalComp = compensationBreakdown.totalCompensation || 0;
        const transportFee = detail.transportFee || 0;
        const totalDeclaredValue = detail.totalDeclaredValue || 0;

        if (!goodsComp && !freightRefund && !totalComp) {
            return null;
        }

        return (
            <div style={{ fontSize: 13, lineHeight: '1.8' }}>
                <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                    <Text strong style={{ color: '#1890ff' }}>Nguồn dữ liệu:</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        • Tổng giá trị hàng hóa trên đơn: {totalDeclaredValue.toLocaleString()} VNĐ
                        <br />
                        • Cước vận chuyển đơn hàng: {transportFee.toLocaleString()} VNĐ
                        <br />
                        • Tỷ lệ thiệt hại áp dụng: 100% (tài xế cố ý / bỏ trốn)
                    </Text>
                </div>

                <div>
                    <Text style={{ fontSize: 12 }}>
                        {/* Dòng 1: công thức bằng câu chữ */}
                        Tổng số tiền bồi thường = Giá trị hàng hóa được bồi thường (100% giá trị tổn thất hợp lệ)
                        {' '}+ Cước vận chuyển được hoàn (100% cước phí đơn hàng)
                        <br />
                        {/* Dòng 2: thế số chi tiết từ công thức câu chữ bằng số gốc */}
                        B_tổng = 100% × {totalDeclaredValue.toLocaleString()} + 100% × {transportFee.toLocaleString()}
                        <br />
                        {/* Dòng 3: rút gọn thành hai số cộng nhau (sau khi áp dụng chính sách) */}
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
            </div>
        );
    };

    const handleContactConfirm = (response: any) => {
        // Response contains: success, message, eventId, status, gracePeriodExpiresAt
        message.success(response.message || 'Đã xác nhận liên hệ với tài xế!');
        setRefreshTrigger(prev => prev + 1); // Refresh data to get updated event
    };

    const handleGracePeriodExtend = (response: any) => {
        // Response contains: success, message, eventId, status, gracePeriodExpiresAt
        message.success(response.message || 'Đã gia hạn thởi gian chờ!');
        setRefreshTrigger(prev => prev + 1); // Refresh data to get updated event
    };

    const handleGracePeriodExpired = () => {
        message.warning('Thời gian chờ đã hết hạn!');
        setRefreshTrigger(prev => prev + 1); // Refresh data to get updated status
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    /**
     * Render detailed calculation formula for OFF_ROUTE case
     * OFF_ROUTE: 100% giá trị hàng + 100% cước, KHÔNG giới hạn 10×
     */
    const renderCalculationFormula = () => {
        const values = form.getFieldsValue();
        const hasDocs = values.hasDocuments ?? true;
        const baseValue = hasDocs ? values.documentValue : values.estimatedMarketValue;
        
        if (!baseValue || !compensationBreakdown.totalCompensation) return null;

        const { goodsCompensation, freightRefund, totalCompensation } = compensationBreakdown;
        const actualTransportFee = detail?.transportFee || 0;

        return (
            <div style={{ 
                padding: '12px', 
                backgroundColor: '#f6ffed', 
                border: '1px solid #b7eb8f', 
                borderRadius: '6px',
                marginTop: '12px'
            }}>
                <Text strong style={{ color: '#389e0d', fontSize: 14 }}>
                    Chi tiết tính toán (Lỗi cố ý):
                </Text>
                <div style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 12 }}>
                        {/* Dòng 1: công thức tổng quát cho OFF_ROUTE */}
                        Tổng số tiền bồi thường
                        {' '}=
                        {' '}100% × Giá trị hàng hóa
                        {' '}+
                        {' '}100% × Cước vận chuyển
                        <br />
                        {/* Dòng 2: thế số chi tiết */}
                        B_tổng = {baseValue.toLocaleString()} + {actualTransportFee.toLocaleString()}
                        <br />
                        {/* Dòng 3: rút gọn thành hai số cộng nhau */}
                        B_tổng = {goodsCompensation.toLocaleString()} + {freightRefund.toLocaleString()}
                        <br />
                        {/* Dòng 4: kết quả cuối cùng */}
                        B_tổng ={' '}
                        <Text style={{ fontSize: 18, color: '#1890ff', fontWeight: 'bold' }}>
                            {totalCompensation.toLocaleString()}
                        </Text>{' '}
                        VNĐ
                        <br />
                        <br />
                        <Text strong style={{ color: '#ff4d4f', fontSize: 12 }}>
                            ⚠️ OFF_ROUTE: KHÔNG áp dụng giới hạn 10× cước vận chuyển
                        </Text>
                    </Text>
                </div>
            </div>
        );
    };

    // Kết quả thẩm định & hoàn tiền từ CompensationService (view-only)
    const assessmentResult = compDetail?.assessment;
    const refundInfo = compDetail?.refundInfo;
    const isResolvedView = !!assessmentResult;

    // Auto-generate staffNotes (Ghi chú đánh giá) - giống pattern của DamageResolutionPanel
    const buildAutoOffRouteStaffNotes = (values: any): string => {
        if (!detail) return '';

        const lines: string[] = [];

        if (detail.packages && detail.packages.length > 0) {
            detail.packages.forEach((pkg, index) => {
                const header = `Kiện hàng ${pkg.trackingCode || `#${index + 1}`}`;
                const desc = pkg.description ? ` (${pkg.description})` : '';
                const declared = pkg.declaredValue ? `, giá trị khai báo ${formatCurrency(pkg.declaredValue)}` : '';
                lines.push(`${header}${desc}${declared}.`);
            });
        }

        const hasDocs = values.hasDocuments ?? true;
        const baseValue = hasDocs ? values.documentValue : values.estimatedMarketValue;
        const baseLabel = hasDocs
            ? 'giá trị theo chứng từ khách cung cấp'
            : 'giá trị thị trường ước tính do nhân viên thẩm định';

        if (baseValue) {
            lines.push(
                `Giá trị dùng để thẩm định cho lô hàng là ${Number(baseValue).toLocaleString('vi-VN')} VNĐ (${baseLabel}).`,
            );
        }

        // CRITICAL: Use passed totalCompensation (fresh API value) instead of stale state
        const total = values.totalCompensation ?? compensationBreakdown.totalCompensation ?? 0;

        if (total > 0) {
            lines.push(
                `Theo chính sách OFF_ROUTE (lỗi cố ý/bỏ trốn), tổng mức bồi thường đề xuất cho lô hàng khoảng ${total.toLocaleString('vi-VN')} VNĐ (bao gồm 100% giá trị hàng và 100% cước vận chuyển).`,
            );
        }

        return lines.join('\n');
    };

    const buildAutoRefundNotesFromValues = (values: any): string => {
        const amount = values.refundAmount;
        if (amount == null || amount === 0) {
            return '';
        }

        const amountText = Number(amount).toLocaleString('vi-VN');
        // Chỉ cần thể hiện nhanh hoàn bao nhiêu tiền và cho việc gì (sự cố OFF_ROUTE)
        return `Hoàn cho khách ${amountText} VNĐ cho bồi thường sự cố tài xế chiếm đoạt/bỏ trốn.`;
    };

    const handleAutoFillStaffNotes = () => {
        const values = form.getFieldsValue();
        const note = buildAutoOffRouteStaffNotes(values);
        if (!note) {
            message.warning('Vui lòng nhập giá trị chứng từ/ước tính và tính preview trước khi tạo ghi chú đánh giá.');
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

    /**
     * Fetch compensation preview from backend
     * Backend is the single source of truth for calculation
     * OFF_ROUTE: 100% giá trị hàng + 100% cước, KHÔNG giới hạn 10×
     */
    const fetchCompensationPreview = async (formValues?: any) => {
        if (!detail) return;

        try {
            // Use passed form values or get current values from form (NOT React state)
            const values = formValues || form.getFieldsValue();

            // OFF_ROUTE mặc định coi như "có chứng từ" nếu user chưa động vào radio
            const hasDocs = values.hasDocuments ?? true;

            // Skip API call nếu thiếu input tương ứng theo trạng thái chứng từ
            if (hasDocs && !values.documentValue) return;
            if (!hasDocs && !values.estimatedMarketValue) return;

            // Show loading state for preview calculation
            setIsCalculatingPreview(true);

            // OFF_ROUTE always uses 100% damage rate
            const breakdown = await calculateCompensationPreview(issue.id, {
                hasDocuments: hasDocs,
                documentValue: values.documentValue,
                estimatedMarketValue: values.estimatedMarketValue,
                assessmentRate: 100, // OFF_ROUTE = 100% loss
            });

            if (breakdown) {
                const total = breakdown.totalCompensation || 0;
                setCompensationBreakdown({
                    goodsCompensation: breakdown.goodsCompensation || 0,
                    freightRefund: breakdown.freightRefund || 0,
                    totalCompensation: total,
                    explanation: breakdown.explanation || 'Lỗi cố ý: KHÔNG áp dụng giới hạn 10× cước'
                });

                setSuggestedCompensationPreview(total);
                // Auto-fill đề xuất chi trả và số tiền hoàn theo preview
                form.setFieldsValue({
                    finalCompensation: total,
                    suggestedCompensation: total,
                    refundAmount: total,
                });

                const latestValues = form.getFieldsValue();
                
                const autoStaff = buildAutoOffRouteStaffNotes({
                    ...latestValues,
                    hasDocuments: hasDocs,
                    documentValue: values.documentValue,
                    estimatedMarketValue: values.estimatedMarketValue,
                    totalCompensation: total, // Use fresh API value
                });
                
                const autoRefund = buildAutoRefundNotesFromValues({
                    ...latestValues,
                    refundAmount: total,
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

    // Legacy alias for compatibility
    const recalculateSuggestedCompensation = () => {
        fetchCompensationPreview();
    };

    const handleFormSubmit = async (values: any) => {
        try {
            setSubmitting(true);

            // When fraud is detected, only fraud reason is needed
            if (values.fraudDetected) {
                const request: CompensationAssessmentRequest = {
                    issueId: issue.id,
                    issueType: 'OFF_ROUTE',
                    hasDocuments: values.hasDocuments ?? false, // Ensure false, not null/undefined
                    documentValue: values.hasDocuments ? values.documentValue : null,
                    estimatedMarketValue: !values.hasDocuments ? values.estimatedMarketValue : null,
                    assessmentRate: 1,
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
                // Fetch lại toàn bộ data để cập nhật UI
                setRefreshTrigger(prev => prev + 1);
                onAssessmentSaved?.();
                return;
            }

            // Normal case (no fraud)
            const shouldCreateRefund =
                !values.fraudDetected &&
                typeof values.refundAmount === 'number' &&
                values.refundAmount > 0;

            const request: CompensationAssessmentRequest = {
                issueId: issue.id,
                issueType: 'OFF_ROUTE',
                hasDocuments: values.hasDocuments,
                documentValue: values.hasDocuments ? values.documentValue : undefined,
                estimatedMarketValue: !values.hasDocuments ? values.estimatedMarketValue : undefined,
                assessmentRate: 1,
                finalCompensation: values.suggestedCompensation,
                staffNotes: values.staffNotes,
                handlerNotes: values.handlerNotes,
                fraudDetected: false,
                fraudReason: undefined,
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
            setRefreshTrigger(prev => prev + 1);
            onAssessmentSaved?.();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi lưu thông tin bồi thường');
        } finally {
            setSubmitting(false);
        }
    };

    const saveAssessment = async () => {
        try {
            const values = await form.validateFields();
            setIsSaving(true);

            // When fraud is detected, only fraud reason is needed
            if (values.fraudDetected) {
                const request: CompensationAssessmentRequest = {
                    issueId: issue.id,
                    issueType: 'OFF_ROUTE',
                    hasDocuments: values.hasDocuments ?? false, // Ensure false, not null/undefined
                    documentValue: values.hasDocuments ? values.documentValue : null,
                    estimatedMarketValue: !values.hasDocuments ? values.estimatedMarketValue : null,
                    // OFF_ROUTE: luôn 100% thiệt hại
                    assessmentRate: 1,
                    finalCompensation: 0, // No compensation for fraud
                    adjustReason: undefined,
                    handlerNotes: values.handlerNotes,
                    fraudDetected: true,
                    fraudReason: values.fraudReason
                };

                await resolveCompensation(request);
                message.success('Đã đánh dấu gian lận và khóa tài khoản khách hàng');
                // Fetch lại toàn bộ data để cập nhật UI
                setRefreshTrigger(prev => prev + 1);
                onAssessmentSaved?.();
                return;
            }

            // Normal case (no fraud)
            const shouldCreateRefund =
                !values.fraudDetected &&
                typeof values.refundAmount === 'number' &&
                values.refundAmount > 0;

            const request: CompensationAssessmentRequest = {
                issueId: issue.id,
                issueType: 'OFF_ROUTE',
                hasDocuments: values.hasDocuments,
                documentValue: values.hasDocuments ? values.documentValue : undefined,
                estimatedMarketValue: !values.hasDocuments ? values.estimatedMarketValue : undefined,
                // OFF_ROUTE: luôn 100% thiệt hại
                assessmentRate: 1,
                finalCompensation: values.suggestedCompensation || suggestedCompensationPreview || 0,
                adjustReason: values.adjustReason,
                handlerNotes: values.handlerNotes,
                fraudDetected: false,
                fraudReason: undefined,
                refund: shouldCreateRefund ? {
                    createOrUpdate: true,
                    refundAmount: values.refundAmount,
                    bankName: values.bankName,
                    accountNumber: values.accountNumber,
                    accountHolderName: values.accountHolderName,
                    transactionCode: values.transactionCode,
                    notes: values.refundNotes
                } : undefined
            };

            await resolveCompensation(request);
            message.success('Đã lưu thông tin bồi thường');
            onAssessmentSaved?.();

            // Refresh data to show updated assessment
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            console.error('Error saving assessment:', error);
            message.error(error.message || 'Không thể lưu thông tin thẩm định');
        } finally {
            setIsSaving(false);
        }
    };

    const getWarningStatusColor = (status: string) => {
        switch (status) {
            case 'NONE':
                return 'default';
            case 'YELLOW_SENT':
                return 'gold';
            case 'RED_SENT':
                return 'red';
            case 'CONTACTED_WAITING_RETURN':
                return 'processing';
            case 'CONTACT_FAILED':
                return 'error';
            case 'ISSUE_CREATED':
                return 'volcano';
            case 'RESOLVED_SAFE':
                return 'success';
            case 'BACK_ON_ROUTE':
                return 'green';
            default:
                return 'default';
        }
    };

    const getWarningStatusLabel = (status: string) => {
        switch (status) {
            case 'NONE':
                return 'Chưa gửi cảnh báo';
            case 'YELLOW_SENT':
                return 'Cảnh báo vàng đã gửi';
            case 'RED_SENT':
                return 'Cảnh báo đỏ đã gửi';
            case 'CONTACTED_WAITING_RETURN':
                return 'Đã liên hệ - Chờ về tuyến';
            case 'CONTACT_FAILED':
                return 'Liên hệ thất bại';
            case 'ISSUE_CREATED':
                return 'Đã tạo sự cố';
            case 'RESOLVED_SAFE':
                return 'Đã xác nhận an toàn';
            case 'BACK_ON_ROUTE':
                return 'Đã về tuyến';
            default:
                return status;
        }
    };

    const packageColumns = [
        {
            title: 'Mã tracking',
            dataIndex: 'trackingCode',
            key: 'trackingCode',
            render: (text: string) => <Text strong copyable>{text}</Text>
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Khối lượng',
            key: 'weight',
            render: (_: any, record: PackageInfo) => (
                <span>{record.weightBaseUnit} {record.unit}</span>
            )
        },
        {
            title: 'Giá trị khai báo',
            dataIndex: 'declaredValue',
            key: 'declaredValue',
            align: 'right' as const,
            render: (value: number) => (
                <Text strong style={{ color: '#1890ff' }}>
                    {formatCurrency(value || 0)}
                </Text>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'DELIVERED' ? 'green' : status === 'IN_TRANSIT' ? 'blue' : 'orange'}>
                    {OrderStatusLabels[status as keyof typeof OrderStatusLabels] || status}
                </Tag>
            )
        }
    ];

    if (loading) {
        return (
            <Card>
                <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
        );
    }

    if (error) {
        return (
            <Alert
                message="Lỗi"
                description={error}
                type="error"
                showIcon
            />
        );
    }

    if (!detail) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Off-Route Event Info */}
            <Card 
                title={
                    <Space>
                        <WarningOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Thông tin sự kiện lệch tuyến</span>
                    </Space>
                }
                bordered={false}
                style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderTop: '3px solid #ff4d4f'
                }}
            >
                {detail.offRouteEventInfo ? (
                    <div className="space-y-4">
                        {/* Alert Banner */}
                        <Alert
                            message="Sự cố lệch tuyến nghiêm trọng"
                            description={`Tài xế đã lệch khỏi tuyến đường đã lên kế hoạch trong ${detail.offRouteEventInfo.offRouteDurationMinutes} phút với khoảng cách ${Math.round(detail.offRouteEventInfo.distanceFromRouteMeters)} mét.`}
                            type="error"
                            showIcon
                            icon={<WarningOutlined />}
                        />
                        
                        {/* Main Stats */}
                        <Row gutter={[24, 16]}>
                            <Col span={6}>
                                <Statistic
                                    title="Thời gian lệch tuyến"
                                    value={detail.offRouteEventInfo.offRouteDurationMinutes}
                                    suffix="phút"
                                    prefix={<ClockCircleOutlined />}
                                    valueStyle={{ color: '#cf1322', fontSize: 28 }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Khoảng cách lệch"
                                    value={Math.round(detail.offRouteEventInfo.distanceFromRouteMeters)}
                                    suffix="mét"
                                    prefix={<EnvironmentOutlined />}
                                    valueStyle={{ color: '#cf1322', fontSize: 28 }}
                                />
                            </Col>
                            <Col span={6}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái cảnh báo</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Tag 
                                            color={getWarningStatusColor(detail.offRouteEventInfo.warningStatus)}
                                            style={{ fontSize: 14, padding: '6px 16px', fontWeight: 600 }}
                                        >
                                            {getWarningStatusLabel(detail.offRouteEventInfo.warningStatus)}
                                        </Tag>
                                    </div>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Liên hệ được tài xế</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Tag 
                                            color={detail.offRouteEventInfo.canContactDriver ? 'success' : 'error'}
                                            style={{ fontSize: 14, padding: '6px 16px' }}
                                        >
                                            {detail.offRouteEventInfo.canContactDriver ? '✓ Có thể liên hệ' : '✗ Không liên hệ được'}
                                        </Tag>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        
                        <Divider style={{ margin: '16px 0' }} />
                        
                        {/* Timeline Info (simplified - only thởi điểm phát hiện + liên hệ gần nhất) */}
                        <Row gutter={[24, 16]}>
                            <Col span={12}>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <Text type="secondary" style={{ fontSize: 12 }}>Thời điểm phát hiện lệch tuyến</Text>
                                    <div><Text strong style={{ fontSize: 14 }}>{formatDateTime(detail.offRouteEventInfo.detectedAt || '')}</Text></div>
                                </div>
                            </Col>
                            {detail.offRouteEventInfo.contactedAt && (
                                <Col span={12}>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <Text type="secondary" style={{ fontSize: 12 }}>Thời điểm liên hệ gần nhất</Text>
                                        <div><Text strong style={{ fontSize: 14, color: '#1890ff' }}>{formatDateTime(detail.offRouteEventInfo.contactedAt)}</Text></div>
                                    </div>
                                </Col>
                            )}
                        </Row>
                        
                        {/* Contact Notes */}
                        {detail.offRouteEventInfo.contactNotes && (
                            <>
                                <Divider style={{ margin: '16px 0' }} />
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <Text type="secondary" style={{ fontSize: 12 }}>Ghi chú liên hệ</Text>
                                    <div><Text style={{ fontSize: 14 }}>{detail.offRouteEventInfo.contactNotes}</Text></div>
                                </div>
                            </>
                        )}
                        
                        {/* Action Buttons - Simplified */}
                        <Divider style={{ margin: '16px 0' }} />
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            {/* Grace Period Countdown - only show if applicable */}
                            {offRouteEvent && offRouteEvent.warningStatus === 'CONTACTED_WAITING_RETURN' && (
                                <GracePeriodCountdown
                                    offRouteEvent={offRouteEvent}
                                    onExpired={handleGracePeriodExpired}
                                />
                            )}
                            
                            {/* Action Buttons - Simplified flow */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {(offRouteEvent?.warningStatus === 'YELLOW_SENT' || offRouteEvent?.warningStatus === 'RED_SENT') && (
                                    <Button
                                        type="primary"
                                        icon={<PhoneOutlined />}
                                        onClick={() => setShowContactModal(true)}
                                        style={{ 
                                            background: offRouteEvent?.warningStatus === 'RED_SENT' ? '#ff4d4f' : '#1890ff', 
                                            borderColor: offRouteEvent?.warningStatus === 'RED_SENT' ? '#ff4d4f' : '#1890ff' 
                                        }}
                                    >
                                        Xác nhận đã liên hệ tài xế
                                    </Button>
                                )}
                            </div>
                        </Space>
                    </div>
                ) : (
                    <Text type="secondary">Không có thông tin sự kiện lệch tuyến</Text>
                )}
            </Card>

            
            {/* Packages Table */}
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
                    borderTop: '3px solid #722ed1'
                }}
                extra={
                    <div style={{
                        background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                        padding: '8px 16px',
                        borderRadius: '6px'
                    }}>
                        <Text strong style={{ color: 'white', fontSize: 14 }}>
                            Tổng giá trị: {formatCurrency(detail.totalDeclaredValue || 0)}
                        </Text>
                    </div>
                }
            >
                <Table
                    columns={packageColumns}
                    dataSource={detail.packages}
                    rowKey="orderDetailId"
                    pagination={false}
                    size="middle"
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <Text strong>Tổng cộng ({detail.packages.length} kiện)</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    <Text strong style={{ color: '#722ed1', fontSize: 16 }}>
                                        {formatCurrency(detail.totalDeclaredValue || 0)}
                                    </Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </Card>

            {/* Issue Evidence Images - Hình ảnh sự cố */}
            {detail?.evidenceImages && detail.evidenceImages.length > 0 && (
                <Card
                    title={
                        <Space>
                            <CameraOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                            <span style={{ fontSize: 16, fontWeight: 600 }}>Hình ảnh sự cố tài xế chiếm đoạt/bỏ trốn</span>
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
                            {detail?.evidenceImages?.map((url: string, idx: number) => (
                                <Image
                                    key={idx}
                                    src={url}
                                    alt={`Hình ảnh sự cố ${idx + 1}`}
                                    className="rounded"
                                    width="100%"
                                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                                />
                            ))}
                        </Image.PreviewGroup>
                    </div>
                </Card>
            )}
            
            {/* Compensation Policy & Suggested Amount */}
            <Card
                title={
                    <Space>
                        <DollarOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Chính sách bồi thường & gợi ý mức chi trả</span>
                    </Space>
                }
                bordered={false}
                style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderTop: '3px solid #52c41a'
                }}
                className="mb-4"
            >
                <Row gutter={[24, 16]}>
                    <Col xs={24} sm={8}>
                        <Statistic
                            title="Cước phí vận chuyển"
                            value={detail.transportFee || 0}
                            formatter={(value) => formatCurrency(Number(value))}
                            prefix={<DollarOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Statistic
                            title="Tổng giá trị khai báo"
                            value={detail.totalDeclaredValue || 0}
                            formatter={(value) => formatCurrency(Number(value))}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Statistic
                            title="Mức bồi thường đề xuất (theo chính sách)"
                            value={(detail.suggestedCompensation ?? 0) || ((detail.totalDeclaredValue || 0) + (detail.transportFee || 0))}
                            formatter={(value) => formatCurrency(Number(value))}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Col>
                </Row>

                {detail.compensationPolicyNote && (
                    <Alert
                        className="mt-4"
                        type="info"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        message="Chính sách bồi thường trong trường hợp tài xế cố ý"
                        description={detail.compensationPolicyNote}
                    />
                )}
            </Card>

            {/* Assessment kết quả / form thẩm định */}
            {isResolvedView && assessmentResult ? (
                <>
                    {/* Trạng thái gian lận */}
                    {assessmentResult.fraudDetected ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Sự cố đã được đánh dấu GIAN LẬN"
                            description={assessmentResult.fraudReason || 'Không có lý do chi tiết'}
                            style={{ marginBottom: 16, border: '2px solid #ff4d4f', background: '#fff2f0' }}
                        />
                    ) : (
                        <Tag color="green" style={{ marginBottom: 16 }}>
                            Xử lý hợp lệ - Không gian lận
                        </Tag>
                    )}

                    {/* Two-column layout for Assessment and Refund - Hide when fraud detected */}
                    {assessmentResult && !assessmentResult.fraudDetected && (
                    <Row gutter={16}>
                        {/* Assessment Column */}
                        <Col xs={24} lg={refundInfo ? 12 : 24}>
                            <Card
                                bordered={false}
                                size="small"
                                style={{
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    borderTop: '3px solid #fa8c16',
                                    height: '100%'
                                }}
                                title={
                                    <Space>
                                        <DollarOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                                        <span style={{ fontSize: 16, fontWeight: 600 }}>Kết quả thẩm định bồi thường</span>
                                    </Space>
                                }
                            >
                                {/* Hình ảnh chứng từ khách hàng cung cấp */}
                                {assessmentResult.documentImages && Array.isArray(assessmentResult.documentImages) && assessmentResult.documentImages.length > 0 && (
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                            Hình ảnh chứng từ khách hàng
                                        </Text>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            <Image.PreviewGroup>
                                                {assessmentResult.documentImages.map((img: string, idx: number) => (
                                                    <Image
                                                        key={idx}
                                                        src={img.trim()}
                                                        alt={`Chứng từ ${idx + 1}`}
                                                        className="rounded"
                                                        width="100%"
                                                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                                                    />
                                                ))}
                                            </Image.PreviewGroup>
                                        </div>
                                    </div>
                                )}

                                <Descriptions column={1} size="small" bordered>
                                    <Descriptions.Item label="Mã thẩm định">
                                        <Text copyable>{assessmentResult.assessmentId || '-'}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Có chứng từ">
                                        <Tag color={assessmentResult.hasDocuments ? 'green' : 'orange'}>
                                            {assessmentResult.hasDocuments ? 'Có' : 'Không'}
                                        </Tag>
                                    </Descriptions.Item>
                                    {assessmentResult.hasDocuments && assessmentResult.documentValue != null && (
                                        <Descriptions.Item label="Giá trị theo chứng từ">
                                            <Text strong>{assessmentResult.documentValue.toLocaleString()} VNĐ</Text>
                                        </Descriptions.Item>
                                    )}
                                    {!assessmentResult.hasDocuments && assessmentResult.estimatedMarketValue != null && (
                                        <Descriptions.Item label="Giá trị thị trường ước tính">
                                            <Text>{assessmentResult.estimatedMarketValue.toLocaleString()} VNĐ</Text>
                                        </Descriptions.Item>
                                    )}
                                    {assessmentResult.compensationByPolicy != null && (
                                        <Descriptions.Item label="Bồi thường theo chính sách">
                                            {assessmentResult.compensationByPolicy.toLocaleString()} VNĐ
                                        </Descriptions.Item>
                                    )}
                                    <Descriptions.Item label="Mức chi trả cuối cùng">
                                        <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                                            {assessmentResult.finalCompensation?.toLocaleString()} VNĐ
                                        </Text>
                                    </Descriptions.Item>
                                    {assessmentResult.adjustReason && (
                                        <Descriptions.Item label="Lý do điều chỉnh">
                                            <Text type="warning">{assessmentResult.adjustReason}</Text>
                                        </Descriptions.Item>
                                    )}
                                    {assessmentResult.staffNotes && (
                                        <Descriptions.Item label="Ghi chú đánh giá">
                                            {assessmentResult.staffNotes}
                                        </Descriptions.Item>
                                    )}
                                    {assessmentResult.handlerNotes && (
                                        <Descriptions.Item label="Ghi chú xử lý">
                                            {assessmentResult.handlerNotes}
                                        </Descriptions.Item>
                                    )}
                                    {assessmentResult.createdByName && (
                                        <Descriptions.Item label="Tạo bởi">
                                            {assessmentResult.createdByName}
                                        </Descriptions.Item>
                                    )}
                                    {assessmentResult.createdAt && (
                                        <Descriptions.Item label="Thời gian tạo">
                                            {formatDateTime(assessmentResult.createdAt)}
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </Card>
                        </Col>

                        {/* Refund Column */}
                        {refundInfo && (
                            <Col xs={24} lg={12}>
                                <Card 
                                    bordered={false}
                                    size="small" 
                                    title={
                                        <Space>
                                            <BankOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                                            <span style={{ fontSize: 16, fontWeight: 600 }}>Thông tin hoàn tiền</span>
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
                <Card
                    title={
                        <Space>
                            <DollarOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                            <span style={{ fontSize: 16, fontWeight: 600 }}>Thẩm định mức bồi thường đề xuất</span>
                        </Space>
                    }
                    bordered={false}
                    style={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        borderTop: '3px solid #fa8c16'
                    }}
                    className="mb-4"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ hasDocuments: true, damageRatePercent: 100, fraudDetected: false }}
                        onFinish={handleFormSubmit}
                        onValuesChange={(changed, allValues) => {
                            if (Object.prototype.hasOwnProperty.call(changed, 'hasDocuments')) {
                                setHasDocuments(changed.hasDocuments);
                                // Clear the opposite field when switching
                                if (changed.hasDocuments) {
                                    form.setFieldsValue({ estimatedMarketValue: undefined });
                                } else {
                                    form.setFieldsValue({ documentValue: undefined });
                                }
                            }
                            // Debounce API call with proper cancellation to avoid race conditions
                            const relevantFields = ['hasDocuments', 'documentValue', 'estimatedMarketValue'];
                            if (relevantFields.some(field => Object.prototype.hasOwnProperty.call(changed, field))) {
                                // Cancel previous pending API call
                                if (debounceTimerRef.current) {
                                    clearTimeout(debounceTimerRef.current);
                                }
                                
                                // Debounce with proper cancellation - use fresh form values when timer fires
                                debounceTimerRef.current = setTimeout(() => {
                                    const currentValues = form.getFieldsValue();
                                    fetchCompensationPreview(currentValues);
                                }, 500);
                            }
                            // Validate toàn bộ form để bật/tắt nút lưu
                            form
                                .validateFields()
                                .then(() => setIsFormValid(true))
                                .catch(() => setIsFormValid(false));
                        }}
                    >
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
                                    <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
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
                                            if (checked) {
                                                // Clear all non-fraud fields when fraud is detected
                                                form.setFieldsValue({
                                                    hasDocuments: false,
                                                    documentValue: null,
                                                    estimatedMarketValue: null,
                                                    suggestedCompensation: 0,
                                                    adjustReason: undefined,
                                                    handlerNotes: undefined,
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
                        type={form.getFieldValue('fraudDetected') ? 'error' : 'info'}
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
                                    <Input.TextArea
                                        rows={3}
                                        placeholder="Mô tả rõ lý do nghi ngờ/khẳng định gian lận, dùng cho kiểm soát nội bộ"
                                    />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    {/* Fraud Warning Banner */}
                    <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.fraudDetected !== currentValues.fraudDetected}>
                        {() => {
                            const isFraud = form.getFieldValue('fraudDetected');
                            return isFraud ? (
                                <Alert
                                    message="⚠️ ĐÁNH DẤU GIAN LẬN - KHÓA TÀI KHOẢN KHÁCH HÀNG"
                                    description="Sự cố này sẽ bị đóng với trạng thái GIAN LẬN. Tài khoản khách hàng sẽ bị khóa. Không cần xử lý bồi thường."
                                    type="error"
                                    showIcon
                                    className="mb-4"
                                    style={{ border: '2px solid #ff4d4f', backgroundColor: '#fff2f0' }}
                                />
                            ) : null;
                        }}
                    </Form.Item>

                    {/* Hide all forms when fraud is detected */}
                    <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.fraudDetected !== currentValues.fraudDetected}>
                        {() => {
                            const isFraud = form.getFieldValue('fraudDetected');
                            return !isFraud ? (
                                <>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="hasDocuments"
                                label="Khách hàng có cung cấp chứng từ hợp lệ?"
                                rules={[{ required: !form.getFieldValue('fraudDetected'), message: 'Vui lòng chọn' }]}
                            >
                                <Radio.Group disabled={form.getFieldValue('fraudDetected')}>
                                    <Radio value={true}>Có chứng từ</Radio>
                                    <Radio value={false}>Không có chứng từ</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        {/* <Col xs={24} sm={12}>
                            <div>
                                <Text strong>Tỷ lệ thiệt hại áp dụng</Text>
                                <div>
                                    <Text>
                                        100% giá trị hàng hoá (mặc định cho trường hợp tài xế cố ý chiếm đoạt / bỏ trốn). Nhân viên chỉ cần thẩm định giá trị hàng (có chứng từ hoặc giá trị thị trường ước tính).
                                    </Text>
                                </div>
                            </div>
                        </Col> */}
                    </Row>

                    {/* Giá trị theo chứng từ / giá trị thị trường ước tính - giống pattern của Damage */}
                    <Form.Item
                        shouldUpdate={(prevValues, currentValues) => prevValues.hasDocuments !== currentValues.hasDocuments || prevValues.fraudDetected !== currentValues.fraudDetected}
                    >
                        {({ getFieldValue }) => {
                            const hasDocs = getFieldValue('hasDocuments');
                            const isFraud = getFieldValue('fraudDetected');

                            if (isFraud) return null;

                            const isDocumentField = hasDocs !== false; // mặc định coi như có chứng từ khi chưa chọn

                            return (
                                <>
                                    <Form.Item
                                        name={isDocumentField ? 'documentValue' : 'estimatedMarketValue'}
                                        label={isDocumentField ? 'Giá trị theo chứng từ (VNĐ)' : 'Giá trị thị trường ước tính (VNĐ)'}
                                        rules={[{
                                            required: true,
                                            message: isDocumentField ? 'Vui lòng nhập giá trị chứng từ' : 'Vui lòng nhập giá trị thị trường ước tính',
                                        }]}
                                    >
                                        <InputNumber
                                            min={1}
                                            style={{ width: '100%' }}
                                            formatter={(value) => {
                                                if (value == null) return '';
                                                return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                            }}
                                            parser={(value) => {
                                                if (!value || value === '') return undefined as any;
                                                const parsed = value?.replace(/\$\s?|(,*)/g, '');
                                                return (parsed ? parseInt(parsed, 10) : undefined) as any;
                                            }}
                                            addonAfter="VNĐ"
                                            placeholder={isDocumentField ? 'Nhập giá trị theo chứng từ khách cung cấp' : 'Giá trị ước tính theo thị trường khi không có chứng từ'}
                                            disabled={isFraud}
                                        />
                                    </Form.Item>

                                    {isDocumentField && (
                                        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                                            Nếu chứng từ thấp hơn khai báo: bồi thường theo chứng từ. Nếu chứng từ cao hơn khai báo: bồi thường tối đa theo giá trị khai báo.
                                        </Text>
                                    )}
                                </>
                            );
                        }}
                    </Form.Item>

                    

                    {/* Staff notes - ghi chú đánh giá, auto-generated */}
                    <Form.Item
                        name="staffNotes"
                        label={
                            <Space>
                                <span>Ghi chú đánh giá</span>
                            </Space>
                        }
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Ghi chú về kết quả đánh giá bồi thường (không bắt buộc)"
                            disabled={form.getFieldValue('fraudDetected')}
                        />
                    </Form.Item>

                    {/* Compensation Breakdown for OFF_ROUTE */}
                    <Card size="small" className="mb-4" style={{ background: '#fff7e6', border: '1px solid #fa8c16' }}>
                        <Row gutter={16}>
                            <Col span={8}>
                                <div className="text-center">
                                    <Text type="secondary">Bồi thường hàng hóa (100%)</Text>
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
                                    <Text type="secondary">Hoàn cước vận chuyển (100%)</Text>
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
                                    <Text type="secondary">Tổng bồi thường</Text>
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
                        
                        {/* Explanation */}
                        <Alert
                            type="info"
                            message={compensationBreakdown.explanation}
                            className="mt-3"
                            showIcon
                        />
                    </Card>

                    {/* Công thức tính toán tổng B_tổng cho OFF_ROUTE */}
                    <Card
                        size="small"
                        style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #1890ff',
                            marginBottom: 16,
                        }}
                    >
                        <Text strong style={{ color: '#1890ff', marginBottom: 8, display: 'block' }}>
                            📊 Công thức tính toán tổng:
                        </Text>
                        {renderOffRouteFormula()}
                    </Card>
                    
                    <Row gutter={16}>
                        <Col xs={24}>
                            <Form.Item
                                name="suggestedCompensation"
                                label="Số tiền đề xuất chi trả (VNĐ)"
                                rules={[{ required: !form.getFieldValue('fraudDetected'), message: 'Vui lòng nhập số tiền đề xuất' }]}
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
                                    placeholder={`Mặc định: ${compensationBreakdown.totalCompensation.toLocaleString()}`}
                                    disabled={form.getFieldValue('fraudDetected')}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Lý do điều chỉnh: chỉ hiển thị khi staff sửa khác với mức hệ thống gợi ý */}
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, current) => prev.suggestedCompensation !== current.suggestedCompensation}
                    >
                        {({ getFieldValue }) => {
                            const suggested = getFieldValue('suggestedCompensation');
                            const previewTotal = compensationBreakdown.totalCompensation;

                            const shouldShowAdjustReason =
                                !form.getFieldValue('fraudDetected') &&
                                typeof suggested === 'number' &&
                                typeof previewTotal === 'number' &&
                                suggested !== previewTotal;

                            if (!shouldShowAdjustReason) {
                                return null;
                            }

                            return (
                                <Form.Item
                                    name="adjustReason"
                                    label="Lý do điều chỉnh (nếu có)"
                                    help="Ghi rõ lý do nếu số tiền đề xuất khác với số tiền hệ thống tự tính"
                                >
                                    <Input.TextArea
                                        rows={2}
                                        placeholder="Ví dụ: Xem xét yếu tố thực tế, áp dụng chính sách hỗ trợ đặc biệt cho khách hàng..."
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    {/* Customer Documents Section - giống Damage, đặt TRƯỚC thông tin hoàn tiền */}
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
                        <Input.TextArea
                            rows={3}
                            placeholder="Ghi chú nội bộ về cách xử lý bồi thường, liên hệ với khách hàng/tài xế (không bắt buộc)"
                            disabled={form.getFieldValue('fraudDetected')}
                        />
                    </Form.Item>

                    {/* Refund information section - luôn sau chứng từ khách hàng */}
                    <Divider titlePlacement="start" style={{ margin: '24px 0 16px 0' }}>
                        <Space>
                            <DollarOutlined style={{ color: '#52c41a' }} />
                            <span>Thông tin hoàn tiền</span>
                        </Space>
                    </Divider>

                    {/* Card: Số tiền hoàn với ô nhập lớn giống Damage */}
                    <Card
                        size="small"
                        style={{
                            backgroundColor: '#ffffff',
                            border: '2px solid #1890ff',
                            marginBottom: 16,
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
                                    rules={[{ required: !form.getFieldValue('fraudDetected'), message: 'Vui lòng nhập số tiền hoàn' }]}
                                >
                                    <InputNumber
                                        min={0}
                                        style={{
                                            width: '100%',
                                            fontSize: '24px',
                                            fontWeight: 'bold',
                                            textAlign: 'right',
                                            backgroundColor: '#ffffff',
                                            borderColor: '#1890ff',
                                        }}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                                        addonAfter="VNĐ"
                                        placeholder="Nhập số tiền đã hoàn cho khách"
                                        disabled={form.getFieldValue('fraudDetected')}
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
                                rules={[{ required: !form.getFieldValue('fraudDetected'), message: 'Vui lòng nhập tên ngân hàng' }]}
                            >
                                <Input placeholder="VD: Vietcombank, Techcombank" disabled={form.getFieldValue('fraudDetected')} />
                            </Form.Item>

                            <Form.Item
                                name="accountNumber"
                                label="Số tài khoản"
                                rules={[{ required: !form.getFieldValue('fraudDetected'), message: 'Vui lòng nhập số tài khoản' }]}
                            >
                                <Input placeholder="Nhập số tài khoản nhận tiền" disabled={form.getFieldValue('fraudDetected')} />
                            </Form.Item>

                            <Form.Item
                                name="accountHolderName"
                                label="Chủ tài khoản"
                                rules={[{ required: !form.getFieldValue('fraudDetected'), message: 'Vui lòng nhập tên chủ tài khoản' }]}
                            >
                                <Input placeholder="Tên đầy đủ của chủ tài khoản" disabled={form.getFieldValue('fraudDetected')} />
                            </Form.Item>

                            <Form.Item
                                name="transactionCode"
                                label="Mã giao dịch"
                            >
                                <Input placeholder="Mã giao dịch chuyển khoản (nếu có)" disabled={form.getFieldValue('fraudDetected')} />
                            </Form.Item>

                            <Form.Item
                                name="refundNotes"
                                label={
                                    <Space>
                                        <span>Ghi chú hoàn tiền</span>
                                    </Space>
                                }
                            >
                                <Input.TextArea rows={3} placeholder="Ghi chú thêm về quá trình hoàn tiền" disabled={form.getFieldValue('fraudDetected')} />
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
                            ) : null;
                        }}
                    </Form.Item>

                    {/* Submit Button */}
                    <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.fraudDetected !== currentValues.fraudDetected}>
                        {() => {
                            const isFraud = form.getFieldValue('fraudDetected');
                            return (
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={submitting || isSaving}
                                    disabled={!isFormValid && !isFraud}
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
                            );
                        }}
                    </Form.Item>
                </Form>
            </Card>
            )}

            {showContactModal && selectedEvent && (
                <ContactConfirmationModal
                    visible={showContactModal}
                    offRouteEvent={selectedEvent}
                    staffId={staffId}
                    onCancel={() => {
                        setShowContactModal(false);
                        setSelectedEvent(null);
                    }}
                    onConfirm={handleContactSuccess}
                />
            )}

            {showGracePeriodModal && selectedEvent && (
                <GracePeriodExtensionModal
                    visible={showGracePeriodModal}
                    offRouteEvent={selectedEvent}
                    staffId={staffId}
                    onCancel={() => {
                        setShowGracePeriodModal(false);
                        setSelectedEvent(null);
                    }}
                    onExtend={handleGracePeriodSuccess}
                />
            )}
        </div>
    );
};

export default OffRouteRunawayDetail;
