import React, { useState, useEffect } from 'react';
import {
  User,
  Truck,
  Phone,
  Mail,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  CreditCard,
  Shield,
  MapPin,
  Navigation,
} from 'lucide-react';
import { Button, Spin, Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import userChatService from '@/services/chat/userChatService';
import type { DriverOverviewResponse } from '@/models/UserChat';
import OrderQuickViewModal from './OrderQuickViewModal';
import VehicleAssignmentQuickViewModal from './VehicleAssignmentQuickViewModal';

interface DriverOverviewModalProps {
  driverId: string;
  visible: boolean;
  onClose: () => void;
  onTripSelect?: (vehicleAssignmentId: string) => void;
  isEmbedded?: boolean;
  zIndex?: number;
}

const DriverOverviewModal: React.FC<DriverOverviewModalProps> = ({ 
  driverId,
  visible,
  onClose,
  onTripSelect,
  isEmbedded = false,
  zIndex = 1000
}) => {
  const [data, setData] = useState<DriverOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderQuickViewId, setOrderQuickViewId] = useState<string | null>(null);
  const [vehicleAssignmentQuickViewId, setVehicleAssignmentQuickViewId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await userChatService.getDriverOverview(driverId);
        setData(response);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin tài xế');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [driverId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi });
  };

  const getDriverStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'ONLINE':
        return 'success';
      case 'INACTIVE':
      case 'OFFLINE':
        return 'default';
      case 'BUSY':
      case 'ON_DELIVERY':
        return 'processing';
      case 'BLOCKED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTripStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'PICKING_UP':
      case 'ON_DELIVERED':
      case 'ONGOING_DELIVERED':
      case 'IN_TRANSIT':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getTripStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'Chờ xử lý',
      'ASSIGNED': 'Đã phân công',
      'PICKING_UP': 'Đang lấy hàng',
      'IN_TRANSIT': 'Đang vận chuyển',
      'ON_DELIVERED': 'Đang giao hàng',
      'ONGOING_DELIVERED': 'Đang trong quá trình giao',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'ACTIVE': 'Đang hoạt động',
      'IN_PROGRESS': 'Đang thực hiện',
      'DELIVERED': 'Đã giao hàng',
      'SUCCESSFUL': 'Hoàn thành thành công',
      'RETURNING': 'Đang trả hàng',
      'RETURNED': 'Đã trả hàng',
    };
    return labels[status?.toUpperCase()] || status;
  };

  const getDriverStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ACTIVE': 'Hoạt động',
      'INACTIVE': 'Không hoạt động',
      'AVAILABLE': 'Sẵn sàng',
      'BUSY': 'Đang bận',
      'ON_DELIVERY': 'Đang giao hàng',
      'OFFLINE': 'Ngoại tuyến',
      'BLOCKED': 'Bị khóa',
    };
    return labels[status?.toUpperCase()] || status;
  };

  const handleTripClick = (vehicleAssignmentId: string) => {
    if (isEmbedded && onTripSelect) {
      onTripSelect(vehicleAssignmentId);
    } else {
      setVehicleAssignmentQuickViewId(vehicleAssignmentId);
    }
  };

  // Render content (shared between embedded and modal modes)
  const renderContent = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {data?.imageUrl ? (
            <img
              src={data.imageUrl}
              alt=""
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                  parent.appendChild(fallback.firstChild!);
                }
              }}
            />
          ) : (
            <User size={32} className="text-gray-400" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{data?.fullName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Mail size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">{data?.email}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Phone size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">{data?.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Tag color={getDriverStatusColor(data?.driverStatus || '')} className="text-xs">
              {getDriverStatusLabel(data?.driverStatus || '')}
            </Tag>
            <span className="text-xs text-gray-500">
              Làm việc từ {formatDate(data?.memberSince)}
            </span>
          </div>
        </div>
      </div>

      {/* License Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium flex items-center gap-2 mb-3">
          <CreditCard size={16} className="text-green-600" />
          Thông tin bằng lái
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Số CMND/CCCD:</span>
            <p className="font-medium">{data?.identityNumber || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Số bằng lái:</span>
            <p className="font-medium">{data?.driverLicenseNumber || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Hạng bằng lái:</span>
            <p className="font-medium">{data?.licenseClass || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Ngày hết hạn:</span>
            <p className={`font-medium ${
              data?.dateOfExpiry && new Date(data.dateOfExpiry) < new Date() 
                ? 'text-red-600' 
                : ''
            }`}>
              {formatDate(data?.dateOfExpiry)}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics - 2 rows */}
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Package size={20} className="mx-auto text-blue-600 mb-1" />
            <div className="text-2xl font-bold text-blue-600">{data?.totalOrdersReceived || 0}</div>
            <div className="text-xs text-gray-600">Tổng đơn nhận</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <Truck size={20} className="mx-auto text-purple-600 mb-1" />
            <div className="text-2xl font-bold text-purple-600">{data?.totalTripsCompleted || 0}</div>
            <div className="text-xs text-gray-600">Chuyến xe</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <CheckCircle size={20} className="mx-auto text-green-600 mb-1" />
            <div className="text-2xl font-bold text-green-600">{data?.successfulDeliveries || 0}</div>
            <div className="text-xs text-gray-600">Thành công ({data?.successRate || 0}%)</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <XCircle size={20} className="mx-auto text-red-600 mb-1" />
            <div className="text-2xl font-bold text-red-600">{data?.cancelledDeliveries || 0}</div>
            <div className="text-xs text-gray-600">Đã hủy ({data?.cancelRate || 0}%)</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <AlertTriangle size={20} className="mx-auto text-orange-600 mb-1" />
            <div className="text-2xl font-bold text-orange-600">{data?.issuesCount || 0}</div>
            <div className="text-xs text-gray-600">Vấn đề gặp phải</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <Shield size={20} className="mx-auto text-yellow-600 mb-1" />
            <div className="text-2xl font-bold text-yellow-600">{data?.penaltiesCount || 0}</div>
            <div className="text-xs text-gray-600">Vi phạm giao thông</div>
          </div>
        </div>
      </div>

      {/* Active Trips */}
      {data?.activeTrips && data.activeTrips.length > 0 && (
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3 text-blue-600">
            <Navigation size={16} />
            Chuyến xe đang thực hiện ({data.activeTrips.length})
          </h4>
          <div className="space-y-2">
            {data.activeTrips.map((trip) => (
              <div
                key={trip.vehicleAssignmentId}
                onClick={() => handleTripClick(trip.vehicleAssignmentId)}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-700 font-mono">{trip.trackingCode}</span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                  {trip.orderCode && (
                    <p className="text-sm text-gray-600">Đơn hàng: {trip.orderCode}</p>
                  )}
                  {trip.receiverName && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {trip.receiverName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Tag color={getTripStatusColor(trip.status)} className="text-xs">
                    {getTripStatusLabel(trip.status)}
                  </Tag>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trips */}
      <div>
        <h4 className="font-medium flex items-center gap-2 mb-3">
          <Truck size={16} className="text-green-600" />
          Chuyến xe gần đây
        </h4>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {!data?.recentTrips || data.recentTrips.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có chuyến xe nào</p>
          ) : (
            data.recentTrips.map((trip) => (
              <div
                key={trip.vehicleAssignmentId}
                onClick={() => handleTripClick(trip.vehicleAssignmentId)}
                className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-all border ${
                  trip.isActive 
                    ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200 hover:border-green-300' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      trip.isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Truck size={14} className={trip.isActive ? 'text-green-600' : 'text-gray-500'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm text-blue-600 font-mono">{trip.trackingCode}</span>
                        {trip.isActive && (
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Tag color={getTripStatusColor(trip.status)} className="text-xs">
                    {getTripStatusLabel(trip.status)}
                  </Tag>
                </div>
                
                {/* Details */}
                <div className="ml-10 space-y-1">
                  {trip.orderCode && (
                    <div className="flex items-center gap-2 text-xs">
                      <Package size={12} className="text-orange-500" />
                      <span className="text-gray-600">Đơn hàng:</span>
                      <span className="font-medium text-orange-600">{trip.orderCode}</span>
                    </div>
                  )}
                  {trip.vehicleType && (
                    <div className="flex items-center gap-2 text-xs">
                      <Truck size={12} className="text-blue-500" />
                      <span className="text-gray-600">Loại xe:</span>
                      <span className="font-medium">{trip.vehicleType}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    Xem chi tiết <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Embedded mode - just content without modal wrapper
  if (isEmbedded) {
    return (
      <div className="h-full overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <AlertTriangle size={40} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : data ? renderContent() : null}
        </div>
      </div>
    );
  }

  // Normal modal mode with side-by-side layout
  return (
    <>
      {/* Backdrop with 10% margin (5% on each side) */}
      <div className="fixed inset-0 bg-black/50" style={{ zIndex: zIndex - 1 }} onClick={onClose} />
      <div className="fixed inset-[5%] flex rounded-lg overflow-hidden shadow-2xl" style={{ zIndex }}>
        {/* Driver Overview Panel - 40% width on left */}
        <div className="bg-white shadow-xl w-[40%] h-full overflow-hidden flex flex-col">
          {/* Header - height matched with quick view modals */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0 min-h-[60px]">
            <div className="flex items-center gap-2">
              <Truck size={18} />
              <div>
                <h2 className="text-base font-semibold">Thông tin tài xế</h2>
                {data && <p className="text-green-100 text-xs">{data.fullName}</p>}
              </div>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              className="text-white hover:bg-green-500"
              size="small"
            />
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Spin size="large" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <AlertTriangle size={40} className="mx-auto mb-2" />
                <p>{error}</p>
              </div>
            ) : data ? renderContent() : null}
          </div>
        </div>

        {/* Vehicle Assignment Quick View Panel - 60% width on right when trip is selected */}
        {vehicleAssignmentQuickViewId ? (
          <VehicleAssignmentQuickViewModal
            vehicleAssignmentId={vehicleAssignmentQuickViewId}
            onClose={() => setVehicleAssignmentQuickViewId(null)}
            onCloseAll={onClose}
            isSideBySide={true}
          />
        ) : (
          <div className="flex-1 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Truck size={48} className="mx-auto mb-2 opacity-50" />
              <p>Chọn một chuyến xe để xem chi tiết</p>
            </div>
          </div>
        )}
      </div>

      {/* Order Quick View Modal (for when clicking from order code) */}
      {orderQuickViewId && (
        <OrderQuickViewModal
          orderId={orderQuickViewId}
          onClose={() => setOrderQuickViewId(null)}
        />
      )}
    </>
  );
};

export default DriverOverviewModal;
