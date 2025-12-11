import React, { useState, useEffect, useRef } from 'react';
import { List, Button, Empty, Spin, Pagination, Modal, Tag, Space } from 'antd';
import NotificationSkeleton from '../../components/shared/NotificationSkeleton';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  BellOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { notificationManager } from '../../services/notificationManager';
import { notificationService } from '../../services/notificationService';
import type { Notification, NotificationType } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import NotificationDetailModal from './NotificationDetailModal';
import { notificationColorMap, notificationNameMap } from '../../utils/notificationTypeMappings';

interface NotificationDropdownProps {
  userId: string;
  userRole: 'STAFF' | 'CUSTOMER';
  onClose: () => void;
  onNotificationRead: () => void;
  refreshTrigger?: number; // Incremented when new notification arrives via WebSocket
  onDropdownClose?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  userId,
  userRole,
  onClose,
  onNotificationRead,
  refreshTrigger = 0,
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // Only show loading on first load
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Default to 'all'
  const [unreadOnly, setUnreadOnly] = useState(false);
  const componentId = useRef('notification-dropdown');
  
  const pageSize = 20; // Increase to match main page

  // Notification type groups for staff (based on actual notification types from backend)
  const notificationGroups = {
    order: {
      label: 'Đơn hàng',
      types: [
        'STAFF_ORDER_CREATED',
        'STAFF_ORDER_PROCESSING', 
        'STAFF_CONTRACT_SIGNED',
        'STAFF_ORDER_CANCELLED',
        'STAFF_DELIVERY_COMPLETED',
        'STAFF_RETURN_COMPLETED',
        'STAFF_RETURN_IN_PROGRESS',
        'ORDER_STATUS_CHANGE'
      ] as NotificationType[]
    },
    issue: {
      label: 'Sự cố',
      types: [
        'NEW_ISSUE_REPORTED',
        'ISSUE_ESCALATED',
        'PACKAGE_DAMAGED',
        'ORDER_REJECTED_BY_RECEIVER',
        'REROUTE_REQUIRED',
        'SEAL_REPLACED',
        'SEAL_REPLACEMENT_COMPLETED',
        'SEAL_ASSIGNED',
        'ISSUE_STATUS_CHANGE',
        'SEAL_REPLACEMENT',
        'ORDER_REJECTION',
        'DAMAGE',
        'REROUTE'
      ] as NotificationType[]
    },
    payment: {
      label: 'Thanh toán',
      types: [
        'STAFF_DEPOSIT_RECEIVED',
        'STAFF_FULL_PAYMENT',
        'STAFF_RETURN_PAYMENT',
        'STAFF_PAYMENT_REMINDER',
        'PAYMENT_DEPOSIT_SUCCESS',
        'PAYMENT_FULL_SUCCESS',
        'PAYMENT_REMINDER',
        'PAYMENT_OVERDUE',
        'COMPENSATION_PROCESSED',
        'PAYMENT_SUCCESS',
        'PAYMENT_TIMEOUT'
      ] as NotificationType[]
    },
    maintenance: {
      label: 'Bảo trì xe',
      types: [
        'VEHICLE_MAINTENANCE_DUE',
        'VEHICLE_INSPECTION_DUE'
      ] as NotificationType[]
    },
    contract: {
      label: 'Hợp đồng',
      types: [
        'CONTRACT_READY',
        'CONTRACT_SIGNED',
        'CONTRACT_SIGN_REMINDER',
        'CONTRACT_SIGN_OVERDUE'
      ] as NotificationType[]
    }
  };

  // Initialize and load data
  useEffect(() => {
    const initializeAndLoad = async () => {
      if (!userId) {
        console.warn('[NotificationDropdown] No userId found');
        return;
      }

      // Always load data first, regardless of manager state
      loadNotifications(true);

      // Register with manager if ready
      if (notificationManager.isReady()) {
        notificationManager.register(componentId.current, {
          onNewNotification: () => {
            loadNotifications(false);
          },
          onListUpdate: () => {
            loadNotifications(false);
          }
        });
      }
    };

    initializeAndLoad();

    return () => {
      if (notificationManager.isReady()) {
        notificationManager.unregister(componentId.current);
      }
    };
  }, [userId]);

  // Register with manager when it becomes ready
  useEffect(() => {
    if (notificationManager.isReady() && userId) {
      notificationManager.register(componentId.current, {
        onNewNotification: () => {
          loadNotifications(false);
        },
        onListUpdate: () => {
          loadNotifications(false);
        }
      });
    }
  }, [notificationManager.isReady(), userId]);

  // Silent reload when page or filter changes
  useEffect(() => {
    if (!initialLoading) {
      // Clear cache when filter changes to prevent stale data (like in NotificationListPage)
      if (selectedCategory !== 'all' || unreadOnly) {
        notificationManager.clearCache();
      }
      loadNotifications(false);
    }
  }, [currentPage, selectedCategory, unreadOnly, refreshTrigger]);

  /**
   * Load notifications
   * @param showLoading - Only show loading spinner on initial load
   */
  const loadNotifications = async (showLoading: boolean = false) => {
    if (showLoading) setInitialLoading(true);
    try {
      // Try to use cache first (for navigation from dropdown) - but only if no filter is applied
      const cache = notificationManager.getCache();
      if (cache && currentPage === 1 && selectedCategory === 'all' && !unreadOnly && !showLoading) {
        console.log('📋 [NotificationDropdown] Using cached data');
        setNotifications(cache.notifications);
        setTotal(cache.total);
        return;
      }

      console.log('🔍 [NotificationDropdown] Fetching fresh data:', {
        selectedCategory,
        unreadOnly,
        currentPage,
        pageSize,
        useCache: cache && currentPage === 1 && selectedCategory === 'all' && !unreadOnly
      });

      // Determine notification type based on category or specific type
      let notificationType = undefined;
      if (selectedCategory && selectedCategory !== 'all') {
        // If category is selected but no specific type, we'll filter on frontend
        notificationType = undefined;
      }

      const response = await notificationService.getNotifications({
        page: currentPage - 1,
        size: pageSize,
        unreadOnly,
        notificationType,
      });

      // Filter by category on frontend if category is selected
      let filteredContent = response.content;
      if (selectedCategory && selectedCategory !== 'all') {
        const categoryTypes = notificationGroups[selectedCategory as keyof typeof notificationGroups]?.types || [];
        console.log('🔍 [NotificationDropdown] Applying category filter:', {
          selectedCategory,
          categoryTypes,
          beforeFilter: response.content.length,
          allTypes: response.content.map(n => n.notificationType),
          matchingTypes: response.content.filter(n => categoryTypes.includes(n.notificationType)).map(n => n.notificationType)
        });
        filteredContent = response.content.filter(n => categoryTypes.includes(n.notificationType));
        console.log('✅ [NotificationDropdown] After category filter:', {
          count: filteredContent.length,
          titles: filteredContent.map(n => n.title)
        });
      }
      
      console.log('📈 [NotificationDropdown] Final result:', {
        total: filteredContent.length,
        first5Types: filteredContent.slice(0, 5).map(n => n.notificationType)
      });
      
      
      // Sort by createdAt descending
      const sortedNotifications = filteredContent.sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sortedNotifications);
      setTotal(selectedCategory && selectedCategory !== 'all' ? filteredContent.length : response.totalElements);
      
      // Cache the results for other components (only when no filter applied)
      if (currentPage === 1 && selectedCategory === 'all' && !unreadOnly) {
        notificationManager.setCache(sortedNotifications, response.totalElements);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      if (showLoading) setInitialLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Open detail modal immediately (no waiting)
    setSelectedNotification({ ...notification, isRead: true }); // Optimistic update
    setDetailModalOpen(true);
    
    // Mark as read in background if unread (no loading, no blocking)
    if (!notification.isRead) {
      // Update local state immediately for instant UI feedback
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      
      // Call API in background using manager (broadcasts to all components)
      notificationManager.markAsRead(notification.id)
        .then(() => {
          onNotificationRead();
        })
        .catch(error => {
          console.error('Failed to mark as read:', error);
          // Revert optimistic update on error
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, isRead: false } : n)
          );
        });
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate(userRole === 'STAFF' ? '/staff/notifications' : '/notifications');
  };

  const getNotificationTypeColor = (type: NotificationType): string => {
    return notificationColorMap[type] || 'default';
  };

  const getNotificationTypeName = (type: NotificationType): string => {
    return notificationNameMap[type] || 'Thông báo';
  };

  return (
    <div className="notification-dropdown" style={{ width: '100%' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BellOutlined className="text-blue-600 text-lg" />
            <h3 className="text-lg font-semibold text-gray-800 m-0">
              Thông báo
            </h3>
          </div>
          <Button
            type="link"
            size="small"
            onClick={handleViewAll}
            className="text-blue-600 hover:text-blue-800"
          >
            Xem tất cả
          </Button>
        </div>
        {/* Filters */}
        {userRole === 'STAFF' && (
          <div className="space-y-2">
            {/* Read/Unread Filter */}
            <div className="flex gap-2">
              <Button
                type={!unreadOnly ? 'primary' : 'default'}
                size="small"
                shape="round"
                className={
                  !unreadOnly
                    ? 'bg-green-600 text-white border-green-600'
                    : ''
                }
                onClick={() => {
                  setUnreadOnly(false);
                  setCurrentPage(1);
                }}
              >
                Tất cả
              </Button>
              <Button
                type={unreadOnly ? 'primary' : 'default'}
                size="small"
                shape="round"
                className={
                  unreadOnly
                    ? 'bg-blue-600 text-white border-blue-600'
                    : ''
                }
                onClick={() => {
                  setUnreadOnly(true);
                  setCurrentPage(1);
                }}
              >
                Chưa đọc
              </Button>
            </div>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
              {/* All filter button */}
              <Button
                type={selectedCategory === 'all' ? 'primary' : 'default'}
                size="small"
                shape="round"
                className={
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 whitespace-nowrap'
                    : 'whitespace-nowrap'
                }
                onClick={() => {
                  if (selectedCategory !== 'all') {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }
                }}
              >
                📊 Tất cả
              </Button>
              {/* Category filter buttons */}
              {Object.entries(notificationGroups).map(([key, group]) => {
                const isActive = selectedCategory === key;
                return (
                  <Button
                    key={key}
                    type={isActive ? 'primary' : 'default'}
                    size="small"
                    shape="round"
                    className={
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 whitespace-nowrap'
                        : 'whitespace-nowrap'
                    }
                    onClick={() => {
                      if (selectedCategory !== key) {
                        setSelectedCategory(key);
                        setCurrentPage(1);
                      }
                    }}
                  >
                    {key === 'order' ? '📦' : key === 'issue' ? '⚠️' : key === 'payment' ? '💰' : key === 'maintenance' ? '🔧' : '📋'} {group.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {initialLoading ? (
          <NotificationSkeleton count={3} showAvatar={true} />
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có thông báo"
            className="py-8"
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                className={`cursor-pointer transition-all duration-200 ${
                  !notification.isRead 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100' 
                    : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag 
                          color={getNotificationTypeColor(notification.notificationType)}
                          className="m-0 text-xs"
                        >
                          {getNotificationTypeName(notification.notificationType)}
                        </Tag>
                        {!notification.isRead ? (
                          <Tag color="blue" className="m-0 text-xs">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                              Chưa đọc
                            </span>
                          </Tag>
                        ) : (
                          <Tag color="default" className="m-0 text-xs">
                            <CheckCircleOutlined className="mr-1" />
                            Đã đọc
                          </Tag>
                        )}
                      </div>
                      <h4 className={`text-sm ${
                        !notification.isRead
                          ? 'font-bold text-gray-900'
                          : 'font-medium text-gray-600'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className={`text-xs mb-0 ${
                        !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ClockCircleOutlined />
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer with Pagination */}
      {total > pageSize && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={setCurrentPage}
            size="small"
            showSizeChanger={false}
            className="text-center"
          />
        </div>
      )}

      {/* Detail Modal */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedNotification(null);
            // Don't reload - we already have optimistic update
            // The list will be refreshed via WebSocket if needed
          }}
          onDropdownClose={onClose}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default NotificationDropdown;
