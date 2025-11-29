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
  const componentId = useRef('notification-dropdown');
  
  const pageSize = 6;

  // Register with notification manager
  useEffect(() => {
    if (!notificationManager.isReady() || !userId) return;

    notificationManager.register(componentId.current, {
      onNewNotification: () => {
        // Silent reload when new notification arrives
        loadNotifications(false);
      },
      onListUpdate: () => {
        // Reload when list updates from other components
        loadNotifications(false);
      }
    });

    // Initial load
    loadNotifications(true);

    return () => {
      notificationManager.unregister(componentId.current);
    };
  }, [userId, notificationManager.isReady()]);

  // Silent reload when page changes
  useEffect(() => {
    if (!initialLoading) {
      loadNotifications(false);
    }
  }, [currentPage, refreshTrigger]);

  /**
   * Load notifications
   * @param showLoading - Only show loading spinner on initial load
   */
  const loadNotifications = async (showLoading: boolean = false) => {
    if (showLoading) setInitialLoading(true);
    try {
      // Don't use cache for pagination - always fetch fresh data
      // Cache is only useful for initial load or refresh, not page changes
      const response = await notificationService.getNotifications({
        page: currentPage - 1,
        size: pageSize,
        unreadOnly: false,
      });
      
      // Sort by createdAt descending
      const sortedNotifications = response.content.sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sortedNotifications);
      setTotal(response.totalElements);
      
      // Only cache the first page for faster initial loads
      if (currentPage === 1) {
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
        <div className="flex items-center justify-between">
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
