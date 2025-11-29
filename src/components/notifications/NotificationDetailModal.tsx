import React from 'react';
import { Modal, Tag, Button, Space, Descriptions, Divider, Table } from 'antd';
import PackageList from './PackageList';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  TagsOutlined,
  ShoppingOutlined,
  CarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { Notification, NotificationType } from '../../types/notification';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { notificationColorMap, notificationNameMap } from '../../utils/notificationTypeMappings';

interface NotificationDetailModalProps {
  notification: Notification;
  open: boolean;
  onClose: () => void;
  onDropdownClose?: () => void;
  userRole: 'STAFF' | 'CUSTOMER';
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  open,
  onClose,
  onDropdownClose,
  userRole,
}) => {
  const navigate = useNavigate();

  const getNotificationTypeColor = (type: NotificationType): string => {
    return notificationColorMap[type] || 'default';
  };

  const getNotificationTypeName = (type: NotificationType): string => {
    return notificationNameMap[type] || 'Thông báo';
  };

  const handleNavigateToRelated = () => {
    // Close dropdown first
    if (onDropdownClose) {
      onDropdownClose();
    }
    // Close detail modal
    onClose();
    
    // Navigate to related page
    if (notification.relatedOrderId) {
      navigate(
        userRole === 'STAFF'
          ? `/staff/orders/${notification.relatedOrderId}`
          : `/orders/${notification.relatedOrderId}`
      );
    } else if (notification.relatedIssueId) {
      navigate(
        userRole === 'STAFF'
          ? `/staff/issues/${notification.relatedIssueId}`
          : `/orders`
      );
    } else if (notification.relatedContractId) {
      navigate(
        userRole === 'STAFF'
          ? `/staff/contracts/${notification.relatedContractId}`
          : `/orders`
      );
    }
  };

  /**
   * Format metadata value for display
   */
  const formatMetadataValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    
    // Format currency values
    if (key.toLowerCase().includes('price') || 
        key.toLowerCase().includes('fee') || 
        key.toLowerCase().includes('amount') ||
        key.toLowerCase().includes('cost')) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
      }
    }
    
    // Format weight
    if (key.toLowerCase().includes('weight')) {
      return `${value}`;
    }
    
    // Format date/time
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('vi-VN');
        }
      } catch {
        // Not a valid date, return as is
      }
    }
    
    return String(value);
  };

  /**
   * Get Vietnamese label for metadata key
   */
  const getMetadataLabel = (key: string): string => {
    const labelMap: Record<string, string> = {
      // Order related
      orderCode: 'Mã đơn hàng',
      orderId: 'ID đơn hàng',
      packageCount: 'Số kiện hàng',
      totalWeight: 'Tổng khối lượng',
      totalPrice: 'Tổng giá trị',
      shippingFee: 'Phí vận chuyển',
      insuranceFee: 'Phí bảo hiểm',
      
      // Driver/Vehicle related
      driverName: 'Tài xế',
      driverPhone: 'SĐT tài xế',
      vehiclePlate: 'Biển số xe',
      vehicleType: 'Loại xe',
      
      // Location related
      pickupAddress: 'Địa chỉ lấy hàng',
      deliveryAddress: 'Địa chỉ giao hàng',
      currentLocation: 'Vị trí hiện tại',
      
      // Status related
      oldStatus: 'Trạng thái cũ',
      newStatus: 'Trạng thái mới',
      status: 'Trạng thái',
      
      // Payment related
      paymentStatus: 'Trạng thái thanh toán',
      paymentMethod: 'Phương thức thanh toán',
      paidAmount: 'Số tiền đã thanh toán',
      remainingAmount: 'Số tiền còn lại',
      
      // Issue related
      issueType: 'Loại sự cố',
      issueDescription: 'Mô tả sự cố',
      damageLevel: 'Mức độ hư hỏng',
      compensationAmount: 'Số tiền bồi thường',
      
      // Time related
      estimatedDeliveryTime: 'Thời gian giao dự kiến',
      actualDeliveryTime: 'Thời gian giao thực tế',
      pickupTime: 'Thời gian lấy hàng',
      
      // Contract related
      contractCode: 'Mã hợp đồng',
      signDeadline: 'Hạn ký hợp đồng',
      paymentDeadline: 'Hạn thanh toán',
      
      // Package details
      affectedPackages: 'Kiện hàng bị ảnh hưởng',
      allPackagesDelivered: 'Tất cả đã giao',
      allPackagesReturned: 'Tất cả đã trả',
      
      // Other
      reason: 'Lý do',
      note: 'Ghi chú',
      description: 'Mô tả',
    };
    
    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  /**
   * Get icon for metadata key
   */
  const getMetadataIcon = (key: string) => {
    if (key.toLowerCase().includes('order') || key.toLowerCase().includes('package')) {
      return <ShoppingOutlined className="text-blue-500" />;
    }
    if (key.toLowerCase().includes('driver') || key.toLowerCase().includes('vehicle')) {
      return <CarOutlined className="text-green-500" />;
    }
    if (key.toLowerCase().includes('price') || key.toLowerCase().includes('fee') || 
        key.toLowerCase().includes('amount') || key.toLowerCase().includes('payment')) {
      return <DollarOutlined className="text-orange-500" />;
    }
    if (key.toLowerCase().includes('address') || key.toLowerCase().includes('location')) {
      return <EnvironmentOutlined className="text-red-500" />;
    }
    if (key.toLowerCase().includes('phone')) {
      return <PhoneOutlined className="text-purple-500" />;
    }
    if (key.toLowerCase().includes('name') || key.toLowerCase().includes('user')) {
      return <UserOutlined className="text-cyan-500" />;
    }
    if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date')) {
      return <CalendarOutlined className="text-indigo-500" />;
    }
    return <InfoCircleOutlined className="text-gray-500" />;
  };

  /**
   * Render metadata in horizontal layout (better for multiple packages)
   */
  const renderHorizontalMetadata = () => {
    if (!notification.metadata || Object.keys(notification.metadata).length === 0) {
      return null;
    }

    // Filter out individual package fields (indexed) since they're shown in PackageList
    // Check if we have packages array (new format with individual packages)
    const packages = notification.metadata.packages as Array<{
      trackingCode?: string;
      description?: string;
      weight?: string;
      weightBaseUnit?: number;
      unit?: string;
    }> | undefined;
    
    // Keep main packageDescription for single package summary
    const packageRelatedFields = [
      /^packageWeight_\d+$/,
      /^packageStatus_\d+$/,
      /^packageDescription_\d+$/,
      /^packageTrackingCode_\d+$/,
      'packages' // Also filter out packages array from the generic entries
    ];

    const allEntries = Object.entries(notification.metadata).filter(
      ([key, value]) => {
        // Skip null/undefined/empty values
        if (value === null || value === undefined || value === '') return false;
        
        // Skip individual package fields (but keep summary fields like packageCount, totalWeight)
        for (const field of packageRelatedFields) {
          if (typeof field === 'string' && key === field) return false;
          if (field instanceof RegExp && field.test(key)) return false;
        }
        
        return true;
      }
    );

    // If we have packages array, only show package count and total weight
    const summaryFields = ['packageCount', 'totalWeight'];
    const entries = packages && packages.length > 0
      ? allEntries.filter(([key]) => summaryFields.includes(key))
      : allEntries;

    // Sort entries
    const keyOrder = ['packageCount', 'totalWeight', 'packageDescription'];
    const sortedEntries = entries.sort((a, b) => {
      const indexA = keyOrder.indexOf(a[0]);
      const indexB = keyOrder.indexOf(b[0]);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return (
      <div className="mt-4">
        <Divider className="my-3" />
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <InfoCircleOutlined className="text-blue-600" />
          Thông tin đơn hàng
          {notification.metadata?.categoryDescription && (
            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
              ({notification.metadata.categoryDescription})
            </span>
          )}
        </h4>
        
        {/* Individual packages table */}
        {packages && packages.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Mã theo dõi</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Mô tả</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Khối lượng</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-gray-900 font-mono text-xs">{pkg.trackingCode || '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{pkg.description || '-'}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{pkg.weight || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <FileTextOutlined className="text-blue-600 text-xl" />
          <span className="text-lg font-semibold">Chi tiết thông báo</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          {(notification.relatedOrderId ||
            notification.relatedIssueId ||
            notification.relatedContractId) && (
            <Button type="primary" onClick={handleNavigateToRelated}>
              Xem chi tiết
            </Button>
          )}
          <Button onClick={onClose}>Đóng</Button>
        </Space>
      }
      width={650}
      className="notification-detail-modal"
    >
      <div className="space-y-4">
        {/* Header Info */}
        <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Tag
                  color={getNotificationTypeColor(notification.notificationType)}
                  icon={<TagsOutlined />}
                  className="m-0"
                >
                  {getNotificationTypeName(notification.notificationType)}
                </Tag>
                {notification.isRead ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    Đã đọc
                  </Tag>
                ) : (
                  <Tag icon={<ClockCircleOutlined />} color="processing">
                    Chưa đọc
                  </Tag>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-0">
                {notification.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FileTextOutlined />
            Nội dung
          </h4>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-0">
            {notification.description}
          </p>
        </div>

        {/* Details */}
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Thời gian tạo">
            <div className="flex items-center gap-2">
              <ClockCircleOutlined className="text-blue-500" />
              {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm:ss', {
                locale: vi,
              })}
            </div>
          </Descriptions.Item>

          {notification.relatedIssueId && (
            <Descriptions.Item label="Mã sự cố">
              <Tag color="orange">{notification.relatedIssueId}</Tag>
            </Descriptions.Item>
          )}

          {notification.relatedVehicleAssignmentId && (
            <Descriptions.Item label="Mã phân công xe">
              <Tag color="purple">{notification.relatedVehicleAssignmentId}</Tag>
            </Descriptions.Item>
          )}

          {notification.relatedContractId && (
            <Descriptions.Item label="Mã hợp đồng">
              <Tag color="green">{notification.relatedContractId}</Tag>
            </Descriptions.Item>
          )}

        </Descriptions>

        {/* Contract Information Section */}
        {notification.metadata?.contractCode && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <FileTextOutlined className="text-blue-600" />
              Thông tin hợp đồng
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã hợp đồng:</span>
                <span className="font-semibold text-gray-900">{notification.metadata.contractCode}</span>
              </div>
              {notification.metadata.depositAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiền cọc cần thanh toán:</span>
                  <span className="font-semibold text-red-600">{notification.metadata.depositAmount}</span>
                </div>
              )}
              {notification.metadata.totalAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng giá trị hợp đồng:</span>
                  <span className="font-semibold text-gray-900">{notification.metadata.totalAmount}</span>
                </div>
              )}
              {notification.metadata.signDeadline && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Hạn ký hợp đồng:</span>
                  <span className="font-semibold text-red-600">{notification.metadata.signDeadline}</span>
                </div>
              )}
              {notification.metadata.signDeadlineInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Lưu ý:</span>
                  <span className="font-semibold text-orange-600">{notification.metadata.signDeadlineInfo}</span>
                </div>
              )}
              {notification.metadata.depositDeadline && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Hạn thanh toán cọc:</span>
                  <span className="font-semibold text-red-600">{notification.metadata.depositDeadline}</span>
                </div>
              )}
              {notification.metadata.depositDeadlineInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Lưu ý:</span>
                  <span className="font-semibold text-orange-600">{notification.metadata.depositDeadlineInfo}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Package information display */}
        {notification.relatedOrderDetailIds &&
          notification.relatedOrderDetailIds.length > 0 && (
            <PackageList
              packageIds={notification.relatedOrderDetailIds}
              metadata={notification.metadata}
              title="Danh sách kiện hàng"
            />
          )}

        {/* Horizontal metadata display */}
        {renderHorizontalMetadata()}
      </div>
    </Modal>
  );
};

export default NotificationDetailModal;
