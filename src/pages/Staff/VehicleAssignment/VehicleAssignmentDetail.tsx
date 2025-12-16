import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Row,
    Col,
    Card,
    Tag,
    Skeleton,
    Breadcrumb,
    Tabs,
    Empty,
    Image,
    Descriptions,
} from "antd";
import {
    CarOutlined,
    IdcardOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
    TagOutlined,
    BoxPlotOutlined,
    EnvironmentOutlined,
    ToolOutlined,
    FileTextOutlined,
    WarningOutlined,
    FireOutlined,
    CameraOutlined,
    ExclamationCircleOutlined,
    DollarOutlined,
    InboxOutlined,
    ShoppingOutlined,
    CalendarOutlined,
    RightOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { vehicleAssignmentService } from "../../../services/vehicle-assignment";
import { VehicleAssignmentTag, OrderStatusTag } from '@/components/common/tags';
import { VehicleAssignmentEnum, OrderStatusEnum } from '@/constants/enums';
import { getIssueStatusLabel, getIssueStatusColor, getSealStatusLabel, getSealStatusColor } from '@/constants/enums';
import { formatSealStatus } from "../../../models/JourneyHistory";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import RouteMapSection from "../../Admin/Order/components/StaffOrderDetail/RouteMapSection";
import vietmapService from '@/services/vietmap/vietmapService';
import OrderDetailStatusCard from "../../../components/common/OrderDetailStatusCard";
import type { ApiResponse } from "../../../services/api/types";

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

const VehicleAssignmentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("vehicle");
    const queryClient = useQueryClient();

    // Fetch vehicle assignment details with full data using new API
    const {
        data: assignmentData,
        isLoading,
        isError
    } = useQuery<ApiResponse<any> | null>({
        queryKey: ["staffVehicleAssignmentFull", id],
        queryFn: () => id ? vehicleAssignmentService.getFullById(id) : null,
        enabled: !!id,
    });

    // Use effect to log the data when it arrives
    React.useEffect(() => {
        if (assignmentData) {
            console.log("🔍 DEBUG: API Response received:", assignmentData);
            console.log("🔍 DEBUG: Devices in response:", assignmentData?.data?.devices);
            console.log("🔍 DEBUG: Device count:", assignmentData?.data?.devices?.length);
            if (assignmentData?.data?.devices?.length > 0) {
                console.log("🔍 DEBUG: Device details:", assignmentData.data.devices);
            }
        }
    }, [assignmentData]);

    // Use any type since backend returns full data
    const va: any = assignmentData?.data;

    const formatDate = (date?: string) => {
        if (!date) return "N/A";
        return dayjs(date).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm');
    };

    if (isError) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Đã xảy ra lỗi</h3>
                    <p>Không thể tải thông tin chuyến xe. Vui lòng thử lại sau.</p>
                </div>
            </div>
        );
    }

    // Tab items
    const tabItems = [
        {
            key: 'vehicle',
            label: <span><CarOutlined /> Xe & Tài xế</span>,
            children: va ? renderVehicleDriverTab() : null,
        },
        {
            key: 'orderDetails',
            label: <span><BoxPlotOutlined /> Danh sách kiện hàng</span>,
            children: va ? renderOrderDetailsTab() : null,
        },
        {
            key: 'journey',
            label: <span><EnvironmentOutlined /> Lộ trình vận chuyển</span>,
            children: va ? renderJourneyTab() : null,
        },
        {
            key: 'issues',
            label: (
                <span>
                    <ToolOutlined /> Sự cố 
                    {va?.issues && va.issues.length > 0 && (
                        <Tag color="red" className="ml-1">{va.issues.length}</Tag>
                    )}
                </span>
            ),
            children: va ? renderIssuesTab() : null,
        },
        {
            key: 'seals',
            label: <span><FileTextOutlined /> Niêm phong</span>,
            children: va ? renderSealsTab() : null,
        },
        {
            key: 'penalties',
            label: <span><WarningOutlined /> Vi phạm & Phạt</span>,
            children: va ? renderPenaltiesTab() : null,
        },
        {
            key: 'fuel',
            label: <span><FireOutlined /> Tiêu thụ nhiên liệu</span>,
            children: va ? renderFuelTab() : null,
        },
        {
            key: 'photos',
            label: <span><CameraOutlined /> Hình ảnh hoàn thành</span>,
            children: va ? renderPhotosTab() : null,
        },
    ];

    // Tab 1: Vehicle & Driver Info
    function renderVehicleDriverTab() {
        if (!va) return null;
        return (
            <div className="space-y-6">
                {/* Vehicle Info */}
                <Card className="shadow-sm rounded-lg border-blue-100" size="small">
                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                            <CarOutlined className="text-xl text-blue-500 mr-3" />
                            <span className="text-lg font-medium">
                                {va.vehicle?.licensePlateNumber || va.licensePlateNumber || "Chưa có thông tin"}
                            </span>
                            <VehicleAssignmentTag status={va.status as VehicleAssignmentEnum} className="ml-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center">
                                <TagOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Nhà sản xuất:</span>
                                <span>{va.vehicle?.manufacturer || va.manufacturer || "Chưa có"}</span>
                            </div>
                            <div className="flex items-center">
                                <CarOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Mẫu xe:</span>
                                <span>{va.vehicle?.model || va.model || "Chưa có"}</span>
                            </div>
                            <div className="flex items-center">
                                <TagOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-1">Loại xe:</span>
                                <span>{va.vehicle?.vehicleTypeDescription || va.vehicleTypeDescription || "Chưa có"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Drivers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <UserOutlined className="text-green-500 mr-2" />
                                <span className="font-medium">Tài xế chính</span>
                            </div>
                            {va.primaryDriver ? (
                                <div className="ml-6 space-y-1">
                                    <div className="flex items-center">
                                        <UserOutlined className="mr-2 text-gray-500" />
                                        <span>{va.primaryDriver.fullName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                        <span>{va.primaryDriver.phoneNumber}</span>
                                    </div>
                                    {va.primaryDriver.email && (
                                        <div className="flex items-center">
                                            <MailOutlined className="mr-2 text-gray-500" />
                                            <span>{va.primaryDriver.email}</span>
                                        </div>
                                    )}
                                    {va.primaryDriver.driverLicenseNumber && (
                                        <div className="flex items-center">
                                            <IdcardOutlined className="mr-2 text-gray-500" />
                                            <span>GPLX: {va.primaryDriver.driverLicenseNumber}</span>
                                        </div>
                                    )}
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
                                <div className="ml-6 space-y-1">
                                    <div className="flex items-center">
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
                </Card>

                {/* Devices Info */}
                {va.devices && va.devices.length > 0 && (
                    <Card className="shadow-sm rounded-lg border-purple-100" size="small">
                        <div className="mb-4 bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center mb-3">
                                <ToolOutlined className="text-xl text-purple-500 mr-3" />
                                <span className="text-lg font-medium">Thiết bị gắn trên xe</span>
                                <Tag color="purple" className="ml-3">{va.devices.length} thiết bị</Tag>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {va.devices.map((device: any) => (
                                <div key={device.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <ToolOutlined className="text-purple-500 mr-2" />
                                        <span className="font-medium">{device.deviceCode}</span>
                                        {device.deviceTypeName && (
                                            <Tag color="blue" className="ml-2">{device.deviceTypeName}</Tag>
                                        )}
                                    </div>
                                    <div className="ml-6 space-y-1 text-sm">
                                        <div className="flex items-center">
                                            <TagOutlined className="mr-2 text-gray-500" />
                                            <span className="text-gray-600">Nhà sản xuất:</span>
                                            <span className="ml-1 font-medium">{device.manufacturer || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <CarOutlined className="mr-2 text-gray-500" />
                                            <span className="text-gray-600">Model:</span>
                                            <span className="ml-1 font-medium">{device.model || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <InfoCircleOutlined className="mr-2 text-gray-500" />
                                            <span className="text-gray-600">IP:</span>
                                            <span className="ml-1 font-mono text-xs">{device.ipAddress || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <ToolOutlined className="mr-2 text-gray-500" />
                                            <span className="text-gray-600">Firmware:</span>
                                            <span className="ml-1 font-mono text-xs">{device.firmwareVersion || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Trip Status */}
                {/* <Card className="shadow-sm rounded-lg" size="small">
                    <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <ClockCircleOutlined className="mr-2 text-purple-600" />
                        Trạng thái chuyến
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Trạng thái</p>
                            <VehicleAssignmentTag status={va.status as VehicleAssignmentEnum} className="mt-1" />
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Mã theo dõi</p>
                            <p className="font-bold text-blue-600 mt-1">{va.trackingCode || "Chưa có"}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                            <p className="font-medium mt-1">{formatDate(va.startDate)}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Ngày kết thúc</p>
                            <p className="font-medium mt-1">{va.endDate ? formatDate(va.endDate) : "Đang thực hiện"}</p>
                        </div>
                    </div>
                </Card> */}
            </div>
        );
    }

    // Tab 2: Order Details (Package List)
    function renderOrderDetailsTab() {
        if (!va) return null;
        const orderDetails = va.orderDetails || [];
        
        if (orderDetails.length === 0) {
            return <Empty description="Không có kiện hàng nào cho chuyến xe này" />;
        }

        return (
            <div className="space-y-4">
                {orderDetails.map((detail: any) => (
                    <Card
                        key={detail.id}
                        className="shadow-md hover:shadow-lg transition-shadow rounded-xl border-l-4 border-l-green-500"
                        size="small"
                    >
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Mã theo dõi</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {detail.trackingCode || "Chưa có"}
                                    </div>
                                </div>
                                <OrderDetailStatusCard status={detail.status} />
                            </div>
                            <div className="border-t border-gray-100"></div>
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
        );
    }

    // Tab 3: Journey/Route
    function renderJourneyTab() {
        if (!va) return null;
        
        if (!va.journeyHistories || va.journeyHistories.length === 0) {
            return <Empty description="Không có lịch sử hành trình nào" />;
        }

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
            <div className="p-2">
                <RouteMapSection
                    journeySegments={activeJourney.journeySegments}
                    journeyInfo={activeJourney}
                    issues={va.issues}
                />
            </div>
        );
    }

    // Tab 4: Issues
    function renderIssuesTab() {
        if (!va) return null;
        
        if (!va.issues || va.issues.length === 0) {
            return <Empty description="Không có sự cố nào được ghi nhận" />;
        }

        return (
            <div className="space-y-4">
                {va.issues.map((issue: any, issueIdx: number) => {
                    const isOrderRejection = issue.issueCategory === 'ORDER_REJECTION';
                    const isSealReplacement = issue.issueCategory === 'SEAL_REPLACEMENT';
                    const isDamage = issue.issueCategory === 'DAMAGE';
                    const isPenalty = issue.issueCategory === 'PENALTY';

                    return (
                        <Card
                            key={issue.id || issueIdx}
                            className={`shadow-md border-l-4 ${
                                isOrderRejection ? 'border-l-red-500 bg-red-50' :
                                isSealReplacement ? 'border-l-yellow-500 bg-yellow-50' :
                                isDamage ? 'border-l-orange-500 bg-orange-50' :
                                isPenalty ? 'border-l-red-600 bg-red-100' :
                                'border-l-blue-500 bg-blue-50'
                            }`}
                            size="small"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ExclamationCircleOutlined className="text-xl text-red-600" />
                                        <div className="text-base font-semibold text-gray-900">
                                            {issue.issueTypeName || 'Sự cố'}
                                        </div>
                                    </div>
                                    {issue.reportedAt && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-7">
                                            <ClockCircleOutlined />
                                            <span>Báo cáo: {formatDate(issue.reportedAt)}</span>
                                        </div>
                                    )}
                                </div>
                                <Tag color={getIssueStatusColor(issue.status)}>
                                    {getIssueStatusLabel(issue.status)}
                                </Tag>
                            </div>

                            <div className="mb-3 p-2 bg-white rounded">
                                <div className="text-sm text-gray-600 font-medium mb-1">Mô tả:</div>
                                <div className="text-sm">{issue.description || 'Không có mô tả'}</div>
                            </div>

                            {(issue.locationLatitude && issue.locationLongitude) && (
                                <IssueLocationDisplay 
                                    latitude={issue.locationLatitude} 
                                    longitude={issue.locationLongitude}
                                />
                            )}

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
                            {isOrderRejection && issue.affectedOrderDetails && issue.affectedOrderDetails.length > 0 && (
                                <div className="mb-3 p-3 bg-white rounded border border-red-200">
                                    <div className="text-sm font-semibold text-red-600 mb-2 flex items-center">
                                        <DollarOutlined className="mr-2" />
                                        Thông tin phí trả hàng
                                    </div>
                                    <Descriptions size="small" column={1} bordered>
                                        {issue.paymentDeadline && (
                                            <Descriptions.Item label="Hạn thanh toán">
                                                <span className="text-red-600 font-medium">
                                                    {formatDate(issue.paymentDeadline)}
                                                </span>
                                            </Descriptions.Item>
                                        )}
                                        {issue.finalFee && (
                                            <Descriptions.Item label="Phí cuối cùng">
                                                <span className="font-bold text-red-600">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(issue.finalFee)}
                                                </span>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
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
                                                <Tag color={getSealStatusColor(issue.newSeal.status)} className="mt-1">
                                                    {getSealStatusLabel(issue.newSeal.status)}
                                                </Tag>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Issue images */}
                            {issue.issueImages && issue.issueImages.length > 0 && (
                                <div className="mb-3 p-2 bg-white rounded">
                                    <div className="text-sm text-gray-600 font-medium mb-2">Hình ảnh sự cố:</div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <Image.PreviewGroup>
                                            {issue.issueImages.map((url: string, idx: number) => (
                                                <Image
                                                    key={idx}
                                                    src={url}
                                                    alt={`Issue image ${idx + 1}`}
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
        );
    }

    // Tab 5: Seals
    function renderSealsTab() {
        if (!va) return null;
        
        if (!va.seals || va.seals.length === 0) {
            return <Empty description="Không có thông tin niêm phong" />;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {va.seals.map((seal: any) => (
                    <div key={seal.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-600">Mã niêm phong</p>
                                <p className="text-base font-bold text-blue-600">{seal.sealCode || seal.sealId}</p>
                            </div>
                            <Tag color={getSealStatusColor(seal.status)} className="ml-2">
                                {formatSealStatus(seal.status)}
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
                                <Image
                                    src={seal.sealAttachedImage}
                                    alt={`Seal ${seal.sealCode}`}
                                    className="w-full h-24 object-cover rounded"
                                    preview={{
                                        mask: 'Xem chi tiết'
                                    }}
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
        );
    }

    // Tab 6: Penalties
    function renderPenaltiesTab() {
        if (!va) return null;
        
        if (!va.penalties || va.penalties.length === 0) {
            return <Empty description="Không có vi phạm nào được ghi nhận" />;
        }

        return (
            <div className="space-y-4">
                {va.penalties.map((penalty: any, index: number) => (
                    <Card
                        key={penalty.id || index}
                        className="shadow-sm hover:shadow-md transition-shadow rounded-lg border-l-4 border-l-red-500"
                        size="small"
                    >
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 font-medium">Loại vi phạm</div>
                                    <div className="text-base font-bold text-gray-900">
                                        {penalty.type || "Không xác định"}
                                    </div>
                                </div>
                                <Tag color="red" className="ml-2">
                                    {penalty.amount ? `${penalty.amount.toLocaleString('vi-VN')} VND` : 'Chưa có'}
                                </Tag>
                            </div>
                            <div className="border-t border-gray-100"></div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600">Mô tả:</span>
                                    <span className="text-sm text-gray-900 text-right max-w-xs">
                                        {penalty.description || "Không có mô tả"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Thời gian:</span>
                                    <span className="font-semibold text-gray-900">
                                        {penalty.createdAt ? formatDate(penalty.createdAt) : "Chưa có"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    // Tab 7: Fuel Consumption
    function renderFuelTab() {
        if (!va) return null;
        
        if (!va.fuelConsumption) {
            return <Empty description="Không có thông tin tiêu thụ nhiên liệu" />;
        }

        const fuel = va.fuelConsumption;
        return (
            <Card className="shadow-sm hover:shadow-md transition-shadow rounded-lg border-l-4 border-l-blue-500">
                <div className="space-y-4">
                    <div className="flex items-center">
                        <FireOutlined className="text-2xl text-blue-500 mr-3" />
                        <div>
                            <div className="text-lg font-bold text-gray-900">
                                Thông tin tiêu thụ nhiên liệu
                            </div>
                            <div className="text-sm text-gray-500">
                                Ghi nhận lúc: {fuel.dateRecorded ? formatDate(fuel.dateRecorded) : "Chưa có"}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Odometer đầu chuyến</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {fuel.odometerReadingAtStart ? `${fuel.odometerReadingAtStart.toLocaleString('vi-VN')} km` : "Chưa có"}
                                </p>
                            </div>
                            {fuel.odometerReadingAtEnd && (
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Odometer cuối chuyến</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {fuel.odometerReadingAtEnd.toLocaleString('vi-VN')} km
                                    </p>
                                </div>
                            )}
                            {fuel.distanceTraveled && (
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Quãng đường đã đi</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {fuel.distanceTraveled.toLocaleString('vi-VN')} km
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            {fuel.fuelVolume && (
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Lượng nhiên liệu</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {fuel.fuelVolume} lít
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Ghi chú</p>
                                <p className="text-sm text-gray-900">
                                    {fuel.notes || "Không có ghi chú"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <Image.PreviewGroup>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fuel.odometerAtStartUrl && (
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-2">Hình ảnh odometer đầu chuyến</p>
                                    <Image
                                        src={fuel.odometerAtStartUrl}
                                        alt="Odometer start"
                                        className="w-full h-32 object-cover rounded border border-gray-200"
                                        preview={{
                                            mask: 'Xem chi tiết'
                                        }}
                                    />
                                </div>
                            )}
                            {fuel.odometerAtEndUrl && (
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-2">Hình ảnh odometer cuối chuyến</p>
                                    <Image
                                        src={fuel.odometerAtEndUrl}
                                        alt="Odometer end"
                                        className="w-full h-32 object-cover rounded border border-gray-200"
                                        preview={{
                                            mask: 'Xem chi tiết'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {fuel.companyInvoiceImageUrl && (
                            <div>
                                <p className="text-xs text-gray-500 font-medium mb-2">Hóa đơn nhiên liệu</p>
                                <Image
                                    src={fuel.companyInvoiceImageUrl}
                                    alt="Company invoice"
                                    className="w-full h-48 object-cover rounded border border-gray-200"
                                    preview={{
                                        mask: 'Xem chi tiết'
                                    }}
                                />
                            </div>
                        )}
                    </Image.PreviewGroup>
                </div>
            </Card>
        );
    }

    // Tab 8: Completion Photos
    function renderPhotosTab() {
        if (!va) return null;
        
        if (!va.photoCompletions || va.photoCompletions.length === 0) {
            return <Empty description="Không có hình ảnh hoàn thành" />;
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Image.PreviewGroup>
                    {va.photoCompletions.map((url: string, idx: number) => (
                        <div key={idx} className="relative group">
                            <Image
                                src={url}
                                alt={`Completion photo ${idx + 1}`}
                                className="object-cover rounded w-full h-32"
                            />
                        </div>
                    ))}
                </Image.PreviewGroup>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Breadcrumb
                    items={[
                        { title: 'Trang chủ', href: '/staff/dashboard' },
                        { title: 'Chuyến xe', href: '/staff/vehicle-assignments' },
                        { title: va?.trackingCode || 'Chi tiết chuyến xe' },
                    ]}
                    className="mb-2"
                />
                <h1 className="text-2xl font-bold text-gray-800">Chi tiết chuyến xe</h1>
            </div>

            {isLoading ? (
                <div className="bg-white p-6 rounded-lg shadow">
                    <Skeleton active paragraph={{ rows: 10 }} />
                </div>
            ) : va ? (
                <div className="space-y-6">
                    {/* Order Info Card - Quick View */}
                    {va.order && (
                        <Card 
                            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500"
                            onClick={() => navigate(`/staff/orders/${va.order.id}`)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                        <ShoppingOutlined className="text-xl text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Đơn hàng liên quan</div>
                                        <div className="text-lg font-bold text-orange-600">{va.order.orderCode}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm text-gray-600 flex items-center">
                                                <CalendarOutlined className="mr-1" />
                                                {formatDate(va.order.createdAt)}
                                            </span>
                                            <OrderStatusTag status={va.order.status as OrderStatusEnum} size="small" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <span className="text-sm mr-2">Xem chi tiết đơn hàng</span>
                                    <RightOutlined />
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Header Info */}
                    <Card className="shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                                    <CarOutlined className="text-2xl text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Mã theo dõi chuyến xe</div>
                                    <div className="text-xl font-bold text-blue-600">{va.trackingCode || "Chưa có"}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <VehicleAssignmentTag status={va.status as VehicleAssignmentEnum} />
                                        <span className="text-sm text-gray-500">
                                            {va.vehicle?.licensePlateNumber || va.licensePlateNumber}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Tabs */}
                    <Card className="shadow-sm">
                        <Tabs 
                            activeKey={activeTab} 
                            onChange={setActiveTab}
                            type="card"
                            items={tabItems}
                        />
                    </Card>
                </div>
            ) : null}
        </div>
    );
};

export default VehicleAssignmentDetailPage;
