import React, { useState, useEffect } from "react";
import { Tabs, Empty, Card, Tag, Image, Descriptions, Row, Col } from "antd";
import {
    BoxPlotOutlined,
    CarOutlined,
    FileTextOutlined,
    ToolOutlined,
    CameraOutlined,
    UserOutlined,
    PhoneOutlined,
    TagOutlined,
    EnvironmentOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    WarningOutlined,
    InboxOutlined,
} from "@ant-design/icons";
import MapPreview from '@/pages/Staff/Issue/components/MapPreview';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import RouteMapSection from "./RouteMapSection";
import OrderDetailStatusCard from "../../../../components/common/OrderDetailStatusCard";
import type { StaffVehicleAssignment } from '@/models/Order';
import { getIssueStatusLabel, getIssueStatusColor, getSealStatusLabel, getSealStatusColor } from '@/constants/enums';
import vietmapService from '@/services/vietmap/vietmapService';

dayjs.extend(utc);
dayjs.extend(timezone);

// Component to display issue location with reverse geocoding
const IssueLocationDisplay: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
    const [address, setAddress] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const results = await vietmapService.reverseGeocode(latitude, longitude);
                if (results && results.length > 0) {
                    setAddress(results[0].display || results[0].address || '');
                }
            } catch (error) {
                console.error('Error fetching address:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAddress();
    }, [latitude, longitude]);

    return (
        <div className="mb-3 p-2 bg-white rounded">
            <div className="text-sm text-gray-600 font-medium mb-1 flex items-center">
                <EnvironmentOutlined className="mr-1 text-red-500" />
                Vị trí sự cố:
            </div>
            <div className="text-sm">
                {loading ? 'Đang tải địa chỉ...' : (address || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`)}
            </div>
        </div>
    );
};

interface VehicleAssignmentSectionProps {
    vehicleAssignments: any[];
    orderDetails: any[];
    formatDate: (date?: string) => string;
    getStatusColor: (status: string) => string;
}

/**
 * Component gộp thông tin chuyến xe + các tab chi tiết
 * - Thông tin chuyến xe luôn hiển thị ở trên
 * - Các tab phía dưới theo chuyến xe được chọn
 */
const VehicleAssignmentSection: React.FC<VehicleAssignmentSectionProps> = ({
    vehicleAssignments,
    orderDetails,
    formatDate,
    getStatusColor,
}) => {
    const [selectedVehicleAssignmentIndex, setSelectedVehicleAssignmentIndex] = useState(0);
    const [activeDetailTab, setActiveDetailTab] = useState("orderDetails");

    if (!vehicleAssignments || vehicleAssignments.length === 0) {
        return <Empty description="Chưa có thông tin phân công xe" />;
    }

    // Nhóm order details theo vehicle assignment
    interface VehicleAssignmentGroup {
        vehicleAssignment: any;
        orderDetails: any[];
    }

    const vehicleAssignmentMap = new Map<string, VehicleAssignmentGroup>();

    vehicleAssignments.forEach((va: any) => {
        vehicleAssignmentMap.set(va.id, {
            vehicleAssignment: va,
            orderDetails: [],
        });
    });

    orderDetails.forEach((detail: any) => {
        if (detail.vehicleAssignmentId) {
            const group = vehicleAssignmentMap.get(detail.vehicleAssignmentId);
            if (group) {
                group.orderDetails.push(detail);
            }
        }
    });

    const vehicleAssignmentGroups = Array.from(vehicleAssignmentMap.values());
    const currentGroup = vehicleAssignmentGroups[selectedVehicleAssignmentIndex];

    if (!currentGroup) {
        return <Empty description="Chưa có thông tin phân công xe" />;
    }

    const va = currentGroup.vehicleAssignment;

    return (
        <div className="vehicle-assignment-section border-2 border-blue-200 rounded-xl bg-blue-50 p-6 shadow-md">
            {/* Header - Tab chọn chuyến xe */}
            <div className="mb-4">
                <div className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
                    <CarOutlined className="mr-2" />
                    Chuyến xe
                </div>
                <Tabs
                    activeKey={selectedVehicleAssignmentIndex.toString()}
                    onChange={(key) => {
                        setSelectedVehicleAssignmentIndex(parseInt(key));
                        setActiveDetailTab("orderDetails"); // Reset to first tab when switching vehicle
                    }}
                    type="card"
                    className="vehicle-tabs"
                    size="small"
                >
                    {vehicleAssignmentGroups.map((group, index) => (
                        <Tabs.TabPane
                            tab={
                                <span>
                                    <CarOutlined /> Chuyến xe #{index + 1} -{" "}
                                    {group.vehicleAssignment.trackingCode || "Chưa có mã"}
                                </span>
                            }
                            key={index.toString()}
                        >
                            {/* Phần này sẽ được render bên dưới */}
                        </Tabs.TabPane>
                    ))}
                </Tabs>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-blue-200 my-4"></div>

            {/* Thông tin chuyến xe - Luôn hiển thị */}
            <Card className="shadow-sm mb-4 rounded-lg border-blue-100" size="small">
                <div className="p-2">
                    {/* Thông tin phương tiện */}
                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                            <CarOutlined className="text-xl text-blue-500 mr-3" />
                            <span className="text-lg font-medium">
                                {va.vehicle?.licensePlateNumber ||
                                    va.licensePlateNumber ||
                                    "Chưa có thông tin"}
                            </span>
                            <Tag
                                className="ml-3"
                                color={getStatusColor(va.status || "")}
                            >
                                {va.status}
                            </Tag>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center">
                                <TagOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Nhà sản xuất:</span>
                                <span>
                                    {va.vehicle?.manufacturer ||
                                        va.manufacturer ||
                                        "Chưa có thông tin"}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <CarOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Mẫu xe:</span>
                                <span>
                                    {va.vehicle?.model ||
                                        va.model ||
                                        "Chưa có thông tin"}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <TagOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Loại xe:</span>
                                <span>
                                    {va.vehicle?.vehicleType ||
                                        va.vehicleType ||
                                        "Chưa có thông tin"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin tài xế */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <UserOutlined className="text-green-500 mr-2" />
                                <span className="font-medium">Tài xế chính</span>
                            </div>
                            {va.primaryDriver ? (
                                <div className="ml-6">
                                    <div className="flex items-center mb-1">
                                        <UserOutlined className="mr-2 text-gray-500" />
                                        <span>{va.primaryDriver.fullName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                        <span>{va.primaryDriver.phoneNumber}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <UserOutlined className="text-blue-500 mr-2" />
                                <span className="font-medium">Tài xế phụ</span>
                            </div>
                            {va.secondaryDriver ? (
                                <div className="ml-6">
                                    <div className="flex items-center mb-1">
                                        <UserOutlined className="mr-2 text-gray-500" />
                                        <span>{va.secondaryDriver.fullName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                        <span>{va.secondaryDriver.phoneNumber}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Divider */}
            <div className="border-t-2 border-blue-200 my-4"></div>

            {/* Các tab chi tiết của chuyến xe được chọn */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
                    <BoxPlotOutlined className="mr-2" />
                    Chi tiết chuyến xe
                </div>
                <Tabs activeKey={activeDetailTab} onChange={setActiveDetailTab} type="card">
                    {/* Tab danh sách kiện hàng */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <BoxPlotOutlined /> Danh sách kiện hàng
                            </span>
                        }
                        key="orderDetails"
                    >
                        {currentGroup.orderDetails.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {currentGroup.orderDetails.map((detail: any) => (
                                    <Card
                                        key={detail.id}
                                        className="shadow-md hover:shadow-lg transition-shadow rounded-xl border-l-4 border-l-green-500"
                                        size="small"
                                    >
                                        <div className="space-y-3">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="text-xs text-gray-500 font-medium">Mã theo dõi</div>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {detail.trackingCode || "Chưa có"}
                                                    </div>
                                                </div>
                                                <OrderDetailStatusCard status={detail.status} />
                                            </div>

                                            {/* Divider */}
                                            <div className="border-t border-gray-100"></div>

                                            {/* Details Grid */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Trọng lượng:</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {detail.weightBaseUnit} {detail.unit}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600">Mô tả:</span>
                                                    <span className="text-sm text-gray-900 text-right max-w-xs">
                                                        {detail.description || "Không có mô tả"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Empty description="Không có kiện hàng nào cho chuyến xe này" />
                        )}
                    </Tabs.TabPane>

                    {/* Tab lộ trình vận chuyển */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <EnvironmentOutlined /> Lộ trình vận chuyển
                            </span>
                        }
                        key="journey"
                    >
                        {va.journeyHistories && va.journeyHistories.length > 0 ? (
                            <div className="p-2">
                                {(() => {
                                    // Chỉ hiển thị ACTIVE journey history mới nhất
                                    const activeJourneys = va.journeyHistories
                                        .filter((j: any) => j.status === 'ACTIVE')
                                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                    
                                    if (activeJourneys.length === 0) {
                                        return <Empty description="Không có lộ trình đang hoạt động" />;
                                    }
                                    
                                    const activeJourney = activeJourneys[0];
                                    
                                    if (!activeJourney.journeySegments || activeJourney.journeySegments.length === 0) {
                                        return <Empty description="Không có thông tin lộ trình" />;
                                    }

                                    return (
                                        <div>
                                            <RouteMapSection
                                                journeySegments={activeJourney.journeySegments}
                                                journeyInfo={activeJourney}
                                                issues={va.issues}
                                            />
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <Empty description="Không có lịch sử hành trình nào" />
                        )}
                    </Tabs.TabPane>

                    {/* Tab sự cố */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <ToolOutlined /> Sự cố {va.issues && va.issues.length > 0 && (
                                    <Tag color="red" className="ml-1">{va.issues.filter((issue: any) => issue.issueCategory !== 'PENALTY').length}</Tag>
                                )}
                            </span>
                        }
                        key="issues"
                    >
                        {va.issues && va.issues.filter((issue: any) => issue.issueCategory !== 'PENALTY').length > 0 ? (
                            <div className="space-y-4">
                                {va.issues.filter((issue: any) => issue.issueCategory !== 'PENALTY').map((issue: any, issueIdx: number) => {
                                    const isOrderRejection = issue.issueCategory === 'ORDER_REJECTION';
                                    const isSealReplacement = issue.issueCategory === 'SEAL_REPLACEMENT';
                                    const isDamage = issue.issueCategory === 'DAMAGE';

                                return (
                                    <Card
                                        key={issue.id || issueIdx}
                                        className={`shadow-md border-l-4 ${
                                            isOrderRejection ? 'border-l-red-500 bg-red-50' :
                                            isSealReplacement ? 'border-l-yellow-500 bg-yellow-50' :
                                            isDamage ? 'border-l-orange-500 bg-orange-50' :
                                            'border-l-blue-500 bg-blue-50'
                                        }`}
                                        size="small"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ExclamationCircleOutlined className="text-xl text-red-600" />
                                                    <div className="text-base font-semibold text-gray-900">
                                                        {issue.issueTypeName || 'Sự cố'}
                                                    </div>
                                                </div>
                                                {issue.reportedAt && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <ClockCircleOutlined />
                                                        <span>Báo cáo: {dayjs(issue.reportedAt).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Tag color={getIssueStatusColor(issue.status)}>
                                                {getIssueStatusLabel(issue.status)}
                                            </Tag>
                                        </div>

                                        {/* Description */}
                                        <div className="mb-3 p-2 bg-white rounded">
                                            <div className="text-sm text-gray-600 font-medium mb-1">Mô tả:</div>
                                            <div className="text-sm">{issue.description || 'Không có mô tả'}</div>
                                        </div>

                                        {/* Location with Reverse Geocoding */}
                                        {(issue.locationLatitude && issue.locationLongitude) && (
                                            <IssueLocationDisplay 
                                                latitude={issue.locationLatitude} 
                                                longitude={issue.locationLongitude}
                                            />
                                        )}

                                        {/* Staff info - Only show when staff is assigned */}
                                        {issue.staff && issue.staff.fullName && (
                                            <div className="mb-3 p-2 bg-white rounded">
                                                <div className="text-sm text-gray-600 font-medium mb-1">Nhân viên xử lý:</div>
                                                <div className="flex items-center gap-4">
                                                    <span><UserOutlined className="mr-1" />{issue.staff.fullName}</span>
                                                    {issue.staff.phoneNumber && (
                                                        <span><PhoneOutlined className="mr-1" />{issue.staff.phoneNumber}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* ORDER_REJECTION specific info */}
                                        {isOrderRejection && (
                                            <div className="mb-3 p-3 bg-white rounded border border-red-200">
                                                <div className="text-sm font-semibold text-red-600 mb-2 flex items-center">
                                                    <DollarOutlined className="mr-2" />
                                                    Thông tin phí trả hàng
                                                </div>
                                                <Descriptions size="small" column={1} bordered>
                                                    {issue.paymentDeadline && (
                                                        <Descriptions.Item label={<span><ClockCircleOutlined className="mr-1" />Hạn thanh toán</span>}>
                                                            <span className="text-red-600 font-medium">
                                                                {dayjs(issue.paymentDeadline).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm')}
                                                            </span>
                                                        </Descriptions.Item>
                                                    )}
                                                    {issue.calculatedFee && (
                                                        <Descriptions.Item label="Phí tính toán">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(issue.calculatedFee)}
                                                        </Descriptions.Item>
                                                    )}
                                                    {issue.adjustedFee !== null && issue.adjustedFee !== undefined && (
                                                        <Descriptions.Item label="Phí điều chỉnh">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(issue.adjustedFee)}
                                                        </Descriptions.Item>
                                                    )}
                                                    {issue.finalFee && (
                                                        <Descriptions.Item label={<span className="font-semibold">Phí cuối cùng</span>}>
                                                            <span className="font-bold text-red-600">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(issue.finalFee)}
                                                            </span>
                                                        </Descriptions.Item>
                                                    )}
                                                </Descriptions>
                                                {issue.affectedOrderDetails && issue.affectedOrderDetails.length > 0 && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <InboxOutlined className="text-lg text-red-600" />
                                                            <span className="text-sm font-semibold text-red-700">
                                                                Kiện hàng bị ảnh hưởng ({issue.affectedOrderDetails.length} kiện)
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {issue.affectedOrderDetails.map((pkg: any, idx: number) => (
                                                                <Card
                                                                    key={idx}
                                                                    size="small"
                                                                    className="shadow-sm hover:shadow-md transition-shadow"
                                                                    style={{ 
                                                                        borderLeft: '4px solid #ff4d4f',
                                                                        background: 'linear-gradient(to right, #fff1f0 0%, #ffffff 10%)'
                                                                    }}
                                                                >
                                                                    <Row gutter={[16, 8]} align="middle">
                                                                        <Col span={24}>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Tag color="red" className="text-xs font-semibold px-2 py-0.5">
                                                                                        #{idx + 1}
                                                                                    </Tag>
                                                                                    <Tag color="error" className="text-xs font-mono">
                                                                                        {pkg.trackingCode || 'N/A'}
                                                                                    </Tag>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <span className="font-bold text-red-700 text-base">
                                                                                        {pkg.weightBaseUnit?.toFixed(2) || '0.00'}
                                                                                    </span>
                                                                                    <span className="text-sm text-gray-600 ml-1">
                                                                                        {pkg.unit || 'kg'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </Col>
                                                                        
                                                                        {pkg.description && (
                                                                            <Col span={24}>
                                                                                <div className="pl-2 border-l-2 border-red-200">
                                                                                    <span className="text-xs text-gray-500 font-semibold">Mô tả:</span>
                                                                                    <p className="text-sm text-gray-700 mb-0 mt-0.5">
                                                                                        {pkg.description}
                                                                                    </p>
                                                                                </div>
                                                                            </Col>
                                                                        )}
                                                                    </Row>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                        
                                                        {/* Total Weight */}
                                                        <Card 
                                                            size="small" 
                                                            className="mt-2 bg-red-50 border-red-300"
                                                            style={{ borderLeft: '4px solid #ff4d4f' }}
                                                        >
                                                            <Row justify="space-between" align="middle">
                                                                <Col>
                                                                    <span className="text-sm font-bold text-red-800">
                                                                        Tổng trọng lượng:
                                                                    </span>
                                                                </Col>
                                                                <Col>
                                                                    <span className="text-lg font-bold text-red-700">
                                                                        {issue.affectedOrderDetails.reduce((sum: number, pkg: any) => 
                                                                            sum + (pkg.weightBaseUnit || 0), 0
                                                                        ).toFixed(2)} kg
                                                                    </span>
                                                                </Col>
                                                            </Row>
                                                        </Card>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SEAL_REPLACEMENT specific info */}
                                        {isSealReplacement && (
                                            <div className="mb-3 p-3 bg-white rounded border border-yellow-200">
                                                <div className="text-sm font-semibold text-yellow-700 mb-2 flex items-center">
                                                    <WarningOutlined className="mr-2" />
                                                    Thông tin thay thế niêm phong
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {issue.oldSeal && (
                                                        <div className="p-2 bg-gray-50 rounded">
                                                            <div className="text-xs text-gray-600 font-medium mb-1">Niêm phong cũ:</div>
                                                            <div className="font-semibold">{issue.oldSeal.sealCode}</div>
                                                            <Tag color="red" className="mt-1">Đã gỡ</Tag>
                                                        </div>
                                                    )}
                                                    {issue.newSeal && (
                                                        <div className="p-2 bg-green-50 rounded">
                                                            <div className="text-xs text-gray-600 font-medium mb-1">Niêm phong mới:</div>
                                                            <div className="font-semibold">{issue.newSeal.sealCode}</div>
                                                            <Tag color={getSealStatusColor(issue.newSeal.status)} className="mt-1">{getSealStatusLabel(issue.newSeal.status)}</Tag>
                                                        </div>
                                                    )}
                                                </div>
                                                {(issue.sealRemovalImage || issue.newSealAttachedImage) && (
                                                    <div className="mt-3">
                                                        <div className="text-xs text-gray-600 font-medium mb-2">Hình ảnh niêm phong:</div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <Image.PreviewGroup>
                                                                {issue.sealRemovalImage && (
                                                                    <div>
                                                                        <div className="text-xs text-gray-500 mb-1">Gỡ niêm phong cũ:</div>
                                                                        <Image 
                                                                            src={issue.sealRemovalImage} 
                                                                            alt="Seal removal" 
                                                                            className="rounded" 
                                                                            width="100%" 
                                                                            style={{maxHeight: '300px', objectFit: 'contain'}} 
                                                                        />
                                                                    </div>
                                                                )}
                                                                {issue.newSealAttachedImage && (
                                                                    <div>
                                                                        <div className="text-xs text-gray-500 mb-1">Gắn niêm phong mới:</div>
                                                                        <Image 
                                                                            src={issue.newSealAttachedImage} 
                                                                            alt="New seal attached" 
                                                                            className="rounded" 
                                                                            width="100%" 
                                                                            style={{maxHeight: '300px', objectFit: 'contain'}} 
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Image.PreviewGroup>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* DAMAGE specific info */}
                                        {isDamage && issue.affectedOrderDetails && issue.affectedOrderDetails.length > 0 && (
                                            <div className="mb-3 p-3 bg-white rounded border border-orange-200">
                                                <div className="text-sm font-semibold text-orange-700 mb-2 flex items-center">
                                                    <InboxOutlined className="mr-2" />
                                                    Kiện hàng bị hư hại ({issue.affectedOrderDetails.length} kiện)
                                                </div>
                                                <div className="space-y-2">
                                                    {issue.affectedOrderDetails.map((pkg: any, idx: number) => (
                                                        <Card
                                                            key={idx}
                                                            size="small"
                                                            className="shadow-sm hover:shadow-md transition-shadow"
                                                            style={{ 
                                                                borderLeft: '4px solid #ff8c00',
                                                                background: 'linear-gradient(to right, #fff7ed 0%, #ffffff 10%)'
                                                            }}
                                                        >
                                                            <Row gutter={[16, 8]} align="middle">
                                                                <Col span={24}>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <Tag color="orange" className="text-xs font-semibold px-2 py-0.5">
                                                                                #{idx + 1}
                                                                            </Tag>
                                                                            <Tag color="warning" className="text-xs font-mono">
                                                                                {pkg.trackingCode || 'N/A'}
                                                                            </Tag>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="font-bold text-orange-700 text-base">
                                                                                {pkg.weightBaseUnit?.toFixed(2) || '0.00'}
                                                                            </span>
                                                                            <span className="text-sm text-gray-600 ml-1">
                                                                                {pkg.unit || 'kg'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                
                                                                {pkg.description && (
                                                                    <Col span={24}>
                                                                        <div className="pl-2 border-l-2 border-orange-200">
                                                                            <span className="text-xs text-gray-500 font-semibold">Mô tả:</span>
                                                                            <p className="text-sm text-gray-700 mb-0 mt-0.5">
                                                                                {pkg.description}
                                                                            </p>
                                                                        </div>
                                                                    </Col>
                                                                )}
                                                            </Row>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Issue images - for all issue types */}
                                        {issue.issueImages && issue.issueImages.length > 0 && (
                                            <div className="mb-3 p-2 bg-white rounded">
                                                <div className="text-sm text-gray-600 font-medium mb-2">
                                                    {isOrderRejection ? 'Ảnh xác nhận trả hàng:' : 'Hình ảnh sự cố:'}
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    <Image.PreviewGroup>
                                                        {issue.issueImages.map((url: string, idx: number) => (
                                                            <Image
                                                                key={idx}
                                                                src={url}
                                                                alt={isOrderRejection ? `Ảnh xác nhận trả hàng ${idx + 1}` : `Issue image ${idx + 1}`}
                                                                className="rounded"
                                                                width="100%"
                                                                style={{maxHeight: '200px', objectFit: 'cover'}}
                                                            />
                                                        ))}
                                                    </Image.PreviewGroup>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                        ) : (
                            <Empty description="Không có sự cố nào được ghi nhận" />
                        )}
                    </Tabs.TabPane>

                    {/* Tab niêm phong */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <FileTextOutlined /> Niêm phong
                            </span>
                        }
                        key="seals"
                    >
                        {va.seals && va.seals.length > 0 ? (
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {va.seals.map((seal: any) => (
                                        <div key={seal.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-600">Mã niêm phong</p>
                                                    <p className="text-base font-bold text-blue-600">{seal.sealCode || seal.sealId}</p>
                                                </div>
                                                <Tag color={getSealStatusColor(seal.status)} className="ml-2">
                                                    {getSealStatusLabel(seal.status)}
                                                </Tag>
                                            </div>

                                            <div className="space-y-2 mb-3 pb-3 border-b border-blue-200">
                                                <div>
                                                    <p className="text-xs text-gray-500">Mô tả</p>
                                                    <p className="text-sm text-gray-700">{seal.description || "Không có mô tả"}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <p className="text-gray-500">Ngày niêm phong</p>
                                                    <p className="font-medium text-gray-700">{seal.sealDate ? formatDate(seal.sealDate) : "Chưa có"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Thời gian gỡ</p>
                                                    <p className="font-medium text-gray-700">{seal.sealRemovalTime ? formatDate(seal.sealRemovalTime) : "Chưa gỡ"}</p>
                                                </div>
                                            </div>

                                            {seal.sealAttachedImage && (
                                                <div className="mt-3 pt-3 border-t border-blue-200">
                                                    <p className="text-xs text-gray-500 mb-2">Hình ảnh niêm phong</p>
                                                    <img
                                                        src={seal.sealAttachedImage}
                                                        alt={`Seal ${seal.sealCode}`}
                                                        className="w-full h-24 object-cover rounded"
                                                    />
                                                </div>
                                            )}

                                            {seal.sealRemovalReason && (
                                                <div className="mt-3 pt-3 border-t border-blue-200">
                                                    <p className="text-xs text-gray-500">Lý do gỡ niêm phong</p>
                                                    <p className="text-sm text-red-600 font-medium">{seal.sealRemovalReason}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Empty description="Không có thông tin niêm phong" />
                        )}
                    </Tabs.TabPane>

                    {/* Tab hình ảnh hoàn thành */}
                    <Tabs.TabPane
                        tab={
                            <span>
                                <CameraOutlined /> Hình ảnh hoàn thành
                            </span>
                        }
                        key="photos"
                    >
                        {va.photoCompletions && va.photoCompletions.length > 0 ? (
                            <div className="p-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {va.photoCompletions.map((url: string, idx: number) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Completion photo ${idx + 1}`}
                                                className="object-cover rounded w-full h-32"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Empty description="Không có hình ảnh hoàn thành" />
                        )}
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </div>
    );
};

export default VehicleAssignmentSection;