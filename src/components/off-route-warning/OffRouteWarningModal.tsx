import React, { useEffect, useState } from 'react';
import { Modal, Button, Tag, Spin, Table, Space, Alert, message, Input, Tooltip, Divider } from 'antd';
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  CarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  IssuesCloseOutlined,
  InfoCircleOutlined,
  IdcardOutlined,
  ShopOutlined,
  BoxPlotOutlined,
} from '@ant-design/icons';
import type { OffRouteWarningPayload, OffRouteEventDetail, PackageInfo, DriverInfo } from '../../services/off-route/types';
import { offRouteService } from '../../services/off-route';
import OffRouteMapView from './OffRouteMapView';
import DriverOverviewModal from '../../pages/Admin/Chat/components/DriverOverviewModal';
import OrderDetailStatusTag from '../../components/common/tags/OrderDetailStatusTag';
import { OrderStatusTag } from '../common';
import type { OrderStatusEnum } from '../../constants/enums';

interface OffRouteWarningModalProps {
  warning: OffRouteWarningPayload | null;
  visible: boolean;
  onClose: () => void;
  onConfirmContact: (eventId: string, notes?: string) => Promise<{ success: boolean; message: string; gracePeriodExpiresAt?: string }>;
  onCreateIssue: (eventId: string, description?: string) => Promise<string | null>;
}

const OffRouteWarningModal: React.FC<OffRouteWarningModalProps> = ({
  warning,
  visible,
  onClose,
  onConfirmContact,
  onCreateIssue,
}) => {
  const [detail, setDetail] = useState<OffRouteEventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [driverOverviewVisible, setDriverOverviewVisible] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const isRed = warning?.severity === 'RED';
  const isYellow = warning?.severity === 'YELLOW';

  // Fetch detail when warning changes
  useEffect(() => {
    if (warning?.offRouteEventId && visible) {
      fetchDetail();
    }
  }, [warning?.offRouteEventId, visible]);

  const fetchDetail = async () => {
    if (!warning) return;
    setLoading(true);
    try {
      const data = await offRouteService.getEventDetail(warning.offRouteEventId);
      setDetail(data);
    } catch (err) {
      console.error('Failed to fetch detail:', err);
      message.error('Không thể tải thông tin chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmContact = async () => {
    if (!warning) return;
    setActionLoading(true);
    try {
      const result = await onConfirmContact(warning.offRouteEventId, notes);
      message.success(result.message || 'Đã xác nhận liên hệ với tài xế. Hệ thống sẽ tiếp tục theo dõi.');
      onClose();
    } catch (err) {
      message.error('Không thể xác nhận liên hệ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!warning) return;
    setActionLoading(true);
    try {
      const issueId = await onCreateIssue(warning.offRouteEventId, notes || 
        `Tài xế lệch tuyến > ${warning.offRouteDurationSeconds} giây, không liên hệ được`);
      if (issueId) {
        message.success('Đã tạo sự cố thành công');
      }
      onClose();
    } catch (err) {
      message.error('Không thể tạo sự cố');
    } finally {
      setActionLoading(false);
    }
  };

  // Open driver overview modal
  const handleDriverInfo = (driver: DriverInfo | undefined) => {
    console.log('🔍 [OffRouteWarningModal] Driver data:', driver);
    console.log('🔍 [OffRouteWarningModal] driverId:', driver?.driverId);
    console.log('🔍 [OffRouteWarningModal] userId:', driver?.userId);
    
    // Use userId for API call, fallback to driverId if userId not available
    const userId = driver?.userId || driver?.driverId;
    if (userId) {
      console.log('🔍 [OffRouteWarningModal] Opening driver overview for userId:', userId);
      setSelectedDriverId(userId);
      setDriverOverviewVisible(true);
    } else {
      message.error('Không tìm thấy thông tin người dùng tài xế');
    }
  };

  // Package table columns
  const packageColumns = [
    {
      title: 'Mã tracking',
      dataIndex: 'trackingCode',
      key: 'trackingCode',
      width: 160,
      render: (text: string) => <span className="font-mono text-xs font-semibold text-blue-600">{text}</span>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Khối lượng',
      key: 'weight',
      width: 100,
      render: (_: any, record: PackageInfo) => (
        <span>{record.weight} {record.weightUnit}</span>
      ),
    },
    {
      title: 'Giá trị khai báo',
      dataIndex: 'declaredValue',
      key: 'declaredValue',
      width: 130,
      render: (value: number) => <span className="text-orange-600 font-semibold">{formatCurrency(value)}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        return <OrderDetailStatusTag status={status} />;
      },
    },
  ];

  // Calculate total declared value from packages
  const totalPackagesDeclaredValue = detail?.packages?.reduce(
    (sum, pkg) => sum + (pkg.declaredValue || 0), 
    0
  ) || 0;

  // Render driver card
  const renderDriverCard = (driver: DriverInfo | undefined, label: string) => {
    if (!driver) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-sm">{label}</span>
          <Tooltip title="Xem thông tin chi tiết">
            <Button 
              type="link" 
              size="small" 
              icon={<InfoCircleOutlined />}
              onClick={() => handleDriverInfo(driver)}
            >
              Chi tiết
            </Button>
          </Tooltip>
        </div>
        <div className="font-semibold text-base">{driver.fullName || 'N/A'}</div>
        <div className="text-sm text-gray-600 mt-1">
          <PhoneOutlined className="mr-1" />
          <a href={`tel:${driver.phoneNumber}`} className="text-blue-600 font-medium">
            {driver.phoneNumber || 'N/A'}
          </a>
        </div>
        {driver.licenseNumber && (
          <div className="text-sm text-gray-500 mt-1">
            <IdcardOutlined className="mr-1" /> GPLX: {driver.licenseNumber}
          </div>
        )}
      </div>
    );
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (!warning) return null;

  return (
    <>
    <Modal
      open={visible}
      onCancel={onClose}
      width={1200}
      centered
      closable={false}
      maskClosable={false}
      keyboard={false}
      zIndex={1000}
      title={
        <div 
          className={`flex items-center gap-3 p-3 -m-6 mb-4 rounded-t-lg ${
            isRed ? 'bg-red-600' : 'bg-yellow-500'
          }`}
        >
          {isRed ? (
            <ExclamationCircleOutlined className="text-white text-2xl" />
          ) : (
            <WarningOutlined className="text-white text-2xl" />
          )}
          <div className="text-white">
            <div className="text-lg font-bold">
              {isRed 
                ? 'CẢNH BÁO NGHIÊM TRỌNG: Không liên hệ được tài xế'
                : 'Cảnh báo: Tài xế có dấu hiệu lệch tuyến'
              }
            </div>
            <div className="text-sm opacity-90">
              Off-route khoảng {warning.offRouteDurationSeconds} giây
              {isRed && ' - Cần kiểm tra ngay'}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-between items-center">
          <div className="text-gray-500 text-sm">
            <ClockCircleOutlined className="mr-1" />
            Cập nhật: {new Date(warning.warningTime).toLocaleString('vi-VN')}
          </div>
          <Space>
            {isRed && (
              <>
                <Button
                  type="primary"
                  icon={<PhoneOutlined />}
                  onClick={handleConfirmContact}
                  loading={actionLoading}
                >
                  Xác nhận đã liên hệ
                </Button>
                <Button
                  danger
                  icon={<IssuesCloseOutlined />}
                  onClick={handleCreateIssue}
                  loading={actionLoading}
                >
                  Báo cáo sự cố
                </Button>
              </>
            )}
            {isYellow && (
              <>
                <Button
                  type="primary"
                  icon={<PhoneOutlined />}
                  onClick={handleConfirmContact}
                  loading={actionLoading}
                >
                  Xác nhận đã liên hệ
                </Button>
                <Button onClick={onClose}>
                  Đã xem
                </Button>
              </>
            )}
            {!isRed && !isYellow && (
              <Button onClick={onClose}>
                Đóng
              </Button>
            )}
          </Space>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      ) : (
        <div className="flex gap-4" style={{ height: '65vh' }}>
          {/* Left Column - Information */}
          <div className="flex-[7] overflow-y-auto pr-2" style={{ maxHeight: '65vh' }}>
            {/* Alert Banner for Red Warning */}
            {isRed && (
              <Alert
                message="Không liên hệ được tài xế"
                description={`Tài xế đã lệch tuyến hơn ${warning.offRouteDurationSeconds} giây. Vui lòng xử lý ngay để đảm bảo an toàn hàng hóa.`}
                type="error"
                showIcon
                className="mb-4"
              />
            )}

            {/* Trip & Vehicle Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold">
                <CarOutlined />
                Thông tin chuyến xe & phương tiện
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Mã chuyến:</span>{' '}
                  <span className="font-mono font-bold text-blue-700">
                    {detail?.tripInfo?.trackingCode || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Biển số:</span>{' '}
                  <span className="font-bold">{detail?.vehicleInfo?.licensePlate || warning.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-gray-500">Loại xe:</span>{' '}
                  <span className="font-medium">
                    {detail?.vehicleInfo?.vehicleTypeDescription || detail?.vehicleInfo?.vehicleType || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Hãng SX:</span>{' '}
                  <span>{detail?.vehicleInfo?.manufacturer || 'N/A'}</span>
                </div>
                {detail?.vehicleInfo?.model && (
                  <div>
                    <span className="text-gray-500">Model:</span>{' '}
                    <span>{detail.vehicleInfo.model}</span>
                  </div>
                )}
                {detail?.vehicleInfo?.loadCapacityKg && (
                  <div>
                    <span className="text-gray-500">Tải trọng:</span>{' '}
                    <span>{(detail.vehicleInfo.loadCapacityKg / 1000).toFixed(1)} tấn</span>
                  </div>
                )}
              </div>
            </div>

            {/* Driver Info - Both Drivers */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                <UserOutlined />
                Thông tin tài xế
              </div>
              <div className="grid grid-cols-2 gap-2">
                {renderDriverCard(detail?.driver1Info || detail?.driverInfo, 'Tài xế 1')}
                {renderDriverCard(detail?.driver2Info, 'Tài xế 2')}
              </div>
              {!detail?.driver1Info && !detail?.driverInfo && !detail?.driver2Info && (
                <div className="text-gray-500 text-sm text-center py-2">Chưa có thông tin tài xế</div>
              )}
            </div>

            {/* Order Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <EnvironmentOutlined />
                  Thông tin đơn hàng
                </div>
                {/* Order Status Tag */}
                {detail?.orderInfo?.status && (
                  <OrderStatusTag status={detail.orderInfo.status as OrderStatusEnum} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Mã đơn:</span>{' '}
                  <span className="font-bold text-green-700">{warning.orderCode}</span>
                </div>
                <div>
                  <span className="text-gray-500">Số kiện:</span>{' '}
                  <span className="font-bold">{warning.packageCount}</span>
                </div>
              </div>
              
              <Divider className="my-2" />
              
              {/* Sender Info */}
              <div className="mb-2">
                <div className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1">
                  <ShopOutlined /> Người gửi
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{detail?.orderInfo?.senderName || warning.senderName || 'N/A'}</div>
                  {detail?.orderInfo?.senderCompanyName && (
                    <div className="text-gray-600">Công ty: {detail.orderInfo.senderCompanyName}</div>
                  )}
                  <div>
                    <PhoneOutlined className="mr-1 text-gray-400" />
                    <a href={`tel:${detail?.orderInfo?.senderPhone}`} className="text-blue-600">
                      {detail?.orderInfo?.senderPhone || warning.senderPhone || 'N/A'}
                    </a>
                  </div>
                  {detail?.orderInfo?.senderAddress && (
                    <div className="text-gray-600 text-xs mt-1">
                      <EnvironmentOutlined className="mr-1" />
                      {detail.orderInfo.senderAddress}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Receiver Info */}
              <div>
                <div className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1">
                  <UserOutlined /> Người nhận
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{detail?.orderInfo?.receiverName || warning.receiverName || 'N/A'}</div>
                  <div>
                    <PhoneOutlined className="mr-1 text-gray-400" />
                    <a href={`tel:${detail?.orderInfo?.receiverPhone}`} className="text-blue-600">
                      {detail?.orderInfo?.receiverPhone || warning.receiverPhone || 'N/A'}
                    </a>
                  </div>
                  {detail?.orderInfo?.receiverIdentity && (
                    <div className="text-gray-600">
                      <IdcardOutlined className="mr-1" /> CCCD: {detail.orderInfo.receiverIdentity}
                    </div>
                  )}
                  {detail?.orderInfo?.receiverAddress && (
                    <div className="text-gray-600 text-xs mt-1">
                      <EnvironmentOutlined className="mr-1" />
                      {detail.orderInfo.receiverAddress}
                    </div>
                  )}
                </div>
              </div>
              
              <Divider className="my-2" />
              
              {/* Financial Info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-100 rounded p-2">
                  <div className="text-gray-500 text-xs">Tiền hợp đồng</div>
                  <div className="font-bold text-green-700 text-lg">
                    {formatCurrency(detail?.orderInfo?.totalContractAmount || 0)}
                  </div>
                </div>
                <div className="bg-orange-100 rounded p-2">
                  <div className="text-gray-500 text-xs">Tổng giá trị khai báo</div>
                  <div className="font-bold text-orange-600 text-lg">
                    {formatCurrency(totalPackagesDeclaredValue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Package Table */}
            {detail?.packages && detail.packages.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <BoxPlotOutlined />
                  Chi tiết kiện hàng ({detail.packages.length} kiện)
                </div>
                <Table
                  columns={packageColumns}
                  dataSource={detail.packages}
                  rowKey="orderDetailId"
                  size="small"
                  pagination={false}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <span className="font-semibold">Tổng cộng</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <span className="font-bold text-orange-600">
                            {formatCurrency(totalPackagesDeclaredValue)}
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </div>
            )}

            {/* Notes Input for Red Warning */}
            {isRed && (
              <div className="mb-4">
                <div className="font-semibold mb-2">Ghi chú (tùy chọn)</div>
                <Input.TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú về tình huống..."
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Right Column - Map with Route and Deviation */}
          <div className="flex-[3] border border-gray-200 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
            <OffRouteMapView
              orderId={warning.orderId}
              vehicleAssignmentId={warning.vehicleAssignmentId}
              currentLocation={detail?.currentLocation || warning.lastKnownLocation}
              plannedRouteSegments={detail?.plannedRouteSegments || []}
              distanceFromRoute={detail?.currentLocation?.distanceFromRouteMeters || warning.lastKnownLocation?.distanceFromRouteMeters}
            />
          </div>
        </div>
      )}
    </Modal>

      {/* Driver Overview Modal */}
      {selectedDriverId && (
        <DriverOverviewModal
          visible={driverOverviewVisible}
          driverId={selectedDriverId}
          zIndex={1001}
          onClose={() => {
            setDriverOverviewVisible(false);
            setSelectedDriverId(null);
          }}
        />
      )}
    </>
  );
};

export default OffRouteWarningModal;
