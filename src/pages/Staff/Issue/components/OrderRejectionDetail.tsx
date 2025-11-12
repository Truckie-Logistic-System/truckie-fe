import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Descriptions,
    InputNumber,
    message,
    Spin,
    Tag,
    Divider,
    Alert,
    Modal,
    Form,
    Select,
    Space
} from 'antd';
import {
    DollarOutlined,
    PhoneOutlined,
    MailOutlined,
    UserOutlined,
    CheckCircleOutlined,
    ShareAltOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import type { Issue } from '@/models/Issue';
import issueService from '@/services/issue';
import { useVietMapRouting } from '@/hooks/useVietMapRouting';

interface OrderRejectionDetailProps {
    issue: Issue;
    onUpdate?: (issue: Issue) => void;
}

interface ReturnFeeInfo {
    issueId: string;
    calculatedFee: number;
    adjustedFee?: number;
    finalFee: number;
    distanceKm: number;
}

interface OrderRejectionInfo {
    issueId: string;
    status: string;
    calculatedFee: number;
    adjustedFee?: number;
    finalFee: number;
    customerInfo?: {
        customerId: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        company?: string;
    };
    affectedOrderDetails: Array<{
        trackingCode: string;
        description?: string;
        weightBaseUnit?: number;
        unit?: string;
    }>;
    returnTransaction?: {
        id: string;
        amount: number;
        status: string;
    };
    paymentDeadline?: string;
    returnDeliveryImages?: string[]; // Multiple images support
}

const OrderRejectionDetail: React.FC<OrderRejectionDetailProps> = ({ issue, onUpdate }) => {
    const [loading] = useState(false);
    const [feeInfo, setFeeInfo] = useState<ReturnFeeInfo | null>(null);
    const [detailInfo, setDetailInfo] = useState<OrderRejectionInfo | null>(null);
    const [adjustedFee, setAdjustedFee] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [routingModalVisible, setRoutingModalVisible] = useState(false);
    const [routeSegments, setRouteSegments] = useState<any[]>([]);
    const [routingLoading, setRoutingLoading] = useState(false);
    const { getRoute } = useVietMapRouting();

    useEffect(() => {
        fetchFeeCalculation();
        fetchRejectionDetail();
    }, [issue.id]);

    const fetchFeeCalculation = async () => {
        try {
            const data = await issueService.calculateReturnShippingFee(issue.id);
            setFeeInfo(data);
            setAdjustedFee(data.adjustedFee || null);
        } catch (error) {
            console.error('Error fetching fee calculation:', error);
        }
    };

    const fetchRejectionDetail = async () => {
        try {
            const data = await issueService.getOrderRejectionDetail(issue.id);
            setDetailInfo(data);
        } catch (error) {
            console.error('Error fetching rejection detail:', error);
        }
    };

    const handleRouting = () => {
        setRoutingModalVisible(true);
        generateReturnRoute();
    };

    const generateReturnRoute = async () => {
        if (!detailInfo?.customerInfo) {
            message.error('Không có thông tin khách hàng');
            return;
        }

        setRoutingLoading(true);
        try {
            // Mock route generation for return journey: carrier → pickup → delivery → pickup → carrier
            // In real implementation, you would get actual coordinates from order addresses
            const mockSegments = [
                {
                    segmentOrder: 1,
                    startPointName: 'Carrier',
                    endPointName: 'Pickup',
                    startLatitude: 10.8231,
                    startLongitude: 106.6297,
                    endLatitude: 10.7769,
                    endLongitude: 106.7009,
                    distanceMeters: 15000,
                    pathCoordinatesJson: JSON.stringify([[106.6297, 10.8231], [106.7009, 10.7769]]),
                    tollDetails: []
                },
                {
                    segmentOrder: 2,
                    startPointName: 'Pickup',
                    endPointName: 'Delivery',
                    startLatitude: 10.7769,
                    startLongitude: 106.7009,
                    endLatitude: 10.7821,
                    endLongitude: 106.6965,
                    distanceMeters: 8000,
                    pathCoordinatesJson: JSON.stringify([[106.7009, 10.7769], [106.6965, 10.7821]]),
                    tollDetails: []
                },
                {
                    segmentOrder: 3,
                    startPointName: 'Delivery',
                    endPointName: 'Pickup (Return)',
                    startLatitude: 10.7821,
                    startLongitude: 106.6965,
                    endLatitude: 10.7769,
                    endLongitude: 106.7009,
                    distanceMeters: 8000,
                    pathCoordinatesJson: JSON.stringify([[106.6965, 10.7821], [106.7009, 10.7769]]),
                    tollDetails: []
                },
                {
                    segmentOrder: 4,
                    startPointName: 'Pickup',
                    endPointName: 'Carrier',
                    startLatitude: 10.7769,
                    startLongitude: 106.7009,
                    endLatitude: 10.8231,
                    endLongitude: 106.6297,
                    distanceMeters: 15000,
                    pathCoordinatesJson: JSON.stringify([[106.7009, 10.7769], [106.6297, 10.8231]]),
                    tollDetails: []
                }
            ];

            setRouteSegments(mockSegments);
        } catch (error) {
            message.error('Không thể tạo lộ trình');
            console.error(error);
        } finally {
            setRoutingLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!feeInfo) {
            message.error('Chưa có thông tin giá cước');
            return;
        }

        if (routeSegments.length === 0) {
            message.error('Chưa có lộ trình trả hàng. Vui lòng tạo lộ trình trước.');
            return;
        }

        setProcessing(true);
        try {
            await issueService.processOrderRejection({
                issueId: issue.id,
                adjustedReturnFee: adjustedFee || undefined,
                routeSegments: routeSegments,
                totalTollFee: 0,
                totalTollCount: 0,
                totalDistance: feeInfo.distanceKm,
                paymentDeadlineHours: 24,
            });

            message.success('Đã xử lý và tạo giao dịch thanh toán');
            if (onUpdate) {
                // Refresh issue data
                const updatedIssue = await issueService.getIssueById(issue.id);
                onUpdate(updatedIssue);
            }
            fetchRejectionDetail();
        } catch (error) {
            message.error('Lỗi xử lý sự cố');
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    if (loading) {
        return (
            <Card title="Xử lý trả hàng">
                <div className="text-center py-8">
                    <Spin size="large" />
                </div>
            </Card>
        );
    }

    return (
        <>
        <Card title="Xử lý người nhận từ chối" className="shadow-md">
            {/* Customer Contact Information */}
            {detailInfo?.customerInfo && (
                <>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <UserOutlined className="mr-2" />
                            Thông tin người gửi
                        </h3>
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Họ tên">
                                {detailInfo.customerInfo.fullName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Công ty">
                                {detailInfo.customerInfo.company || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<><PhoneOutlined /> Điện thoại</>}>
                                <a href={`tel:${detailInfo.customerInfo.phoneNumber}`}>
                                    {detailInfo.customerInfo.phoneNumber}
                                </a>
                            </Descriptions.Item>
                            <Descriptions.Item label={<><MailOutlined /> Email</>}>
                                <a href={`mailto:${detailInfo.customerInfo.email}`}>
                                    {detailInfo.customerInfo.email}
                                </a>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                    <Divider />
                </>
            )}

            {/* Affected Packages */}
            {detailInfo?.affectedOrderDetails && detailInfo.affectedOrderDetails.length > 0 && (
                <>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-3">
                            Các kiện hàng cần trả ({detailInfo.affectedOrderDetails.length} kiện)
                        </h3>
                        <div className="space-y-2">
                            {detailInfo.affectedOrderDetails.map((pkg, index) => (
                                <Card size="small" key={index} className="bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <Tag color="blue">{pkg.trackingCode}</Tag>
                                            {pkg.description && (
                                                <span className="ml-2 text-gray-600">{pkg.description}</span>
                                            )}
                                        </div>
                                        {pkg.weightBaseUnit && (
                                            <span className="text-gray-500">
                                                {pkg.weightBaseUnit} {pkg.unit || 'kg'}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                    <Divider />
                </>
            )}

            {/* Fee Calculation */}
            {feeInfo && (
                <>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <DollarOutlined className="mr-2" />
                            Cước phí trả hàng
                        </h3>
                        <Alert
                            message="Khoảng cách trả hàng"
                            description={`${feeInfo.distanceKm.toFixed(2)} km (từ điểm giao về điểm lấy hàng)`}
                            type="info"
                            showIcon
                            className="mb-3"
                        />
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="Giá cước tính toán">
                                <span className="font-semibold text-blue-600">
                                    {formatCurrency(feeInfo.calculatedFee)}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Điều chỉnh giá (VIP customer, etc.)">
                                <InputNumber
                                    value={adjustedFee}
                                    onChange={setAdjustedFee}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                                    style={{ width: '100%' }}
                                    placeholder={`Mặc định: ${formatCurrency(feeInfo.calculatedFee)}`}
                                    disabled={detailInfo?.status !== 'OPEN'}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá cuối cùng">
                                <span className="text-xl font-bold text-green-600">
                                    {formatCurrency(adjustedFee || feeInfo.calculatedFee)}
                                </span>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                    <Divider />
                </>
            )}

            {/* Transaction Status */}
            {detailInfo?.returnTransaction && (
                <>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-3">Trạng thái giao dịch</h3>
                        <Descriptions bordered size="small">
                            <Descriptions.Item label="Mã giao dịch">
                                {detailInfo.returnTransaction.id}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số tiền">
                                {formatCurrency(detailInfo.returnTransaction.amount)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={
                                    detailInfo.returnTransaction.status === 'PAID' ? 'green' :
                                    detailInfo.returnTransaction.status === 'PENDING' ? 'orange' :
                                    'red'
                                }>
                                    {detailInfo.returnTransaction.status}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                        {detailInfo.paymentDeadline && (
                            <Alert
                                message="Hạn thanh toán"
                                description={new Date(detailInfo.paymentDeadline).toLocaleString('vi-VN')}
                                type="warning"
                                showIcon
                                className="mt-3"
                            />
                        )}
                    </div>
                </>
            )}

            {/* Action Buttons */}
            {issue.status === 'OPEN' && (
                <div className="mt-4 flex justify-end gap-3">
                    <Button
                        size="large"
                        icon={<ShareAltOutlined />}
                        onClick={handleRouting}
                        loading={routingLoading}
                    >
                        Tạo lộ trình trả hàng
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={handleProcess}
                        loading={processing}
                        disabled={!feeInfo || routeSegments.length === 0}
                    >
                        Xác nhận và tạo giao dịch
                    </Button>
                </div>
            )}

            {issue.status === 'IN_PROGRESS' && (
                <Alert
                    message="Đang chờ khách hàng thanh toán"
                    description="Khi khách hàng thanh toán thành công, hệ thống sẽ tự động kích hoạt lộ trình trả hàng cho tài xế."
                    type="info"
                    showIcon
                />
            )}

            {issue.status === 'RESOLVED' && (
                <>
                    <Alert
                        message="Đã hoàn tất"
                        description="Khách hàng đã thanh toán và tài xế đã trả hàng về điểm lấy hàng."
                        type="success"
                        showIcon
                    />
                    
                    {/* Return Delivery Images */}
                    {detailInfo?.returnDeliveryImages && detailInfo.returnDeliveryImages.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-3">Ảnh xác nhận trả hàng</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {detailInfo.returnDeliveryImages.map((imageUrl, index) => (
                                    <div key={index} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                        <img 
                                            src={imageUrl} 
                                            alt={`Ảnh trả hàng ${index + 1}`}
                                            className="w-full h-48 object-cover cursor-pointer"
                                            onClick={() => window.open(imageUrl, '_blank')}
                                        />
                                        <div className="p-2 bg-gray-50 text-center text-sm text-gray-600">
                                            Ảnh {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Card>

        {/* Routing Modal */}
        <Modal
            title="Tạo lộ trình trả hàng"
            open={routingModalVisible}
            onCancel={() => setRoutingModalVisible(false)}
            width={800}
            footer={[
                <Button key="cancel" onClick={() => setRoutingModalVisible(false)}>
                    Hủy
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    onClick={() => {
                        setRoutingModalVisible(false);
                        message.success(`Đã tạo lộ trình với ${routeSegments.length} đoạn đường`);
                    }}
                    disabled={routeSegments.length === 0}
                >
                    Xác nhận lộ trình
                </Button>
            ]}
        >
            {routingLoading ? (
                <div className="text-center py-8">
                    <Spin size="large" />
                    <div className="mt-4 text-gray-600">Đang tạo lộ trình trả hàng...</div>
                </div>
            ) : (
                <div>
                    <Alert
                        message="Lộ trình trả hàng"
                        description="Hệ thống sẽ tạo lộ trình: Carrier → Pickup → Delivery → Pickup (Return) → Carrier"
                        type="info"
                        showIcon
                        className="mb-4"
                    />
                    
                    {routeSegments.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-3">Chi tiết lộ trình ({routeSegments.length} đoạn):</h4>
                            <div className="space-y-3">
                                {routeSegments.map((segment, index) => (
                                    <Card key={index} size="small" className="bg-gray-50">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Tag color="blue">Đoạn {segment.segmentOrder}</Tag>
                                                <span className="font-medium">
                                                    {segment.startPointName} → {segment.endPointName}
                                                </span>
                                            </div>
                                            <div className="text-gray-500 text-sm">
                                                {(segment.distanceMeters / 1000).toFixed(1)} km
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
        </>
    );
};

export default OrderRejectionDetail;
