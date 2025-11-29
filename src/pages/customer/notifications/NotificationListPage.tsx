import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  List,
  Button,
  Empty,
  Spin,
  Pagination,
  Tag,
  Space,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Badge,
  message,
} from 'antd';
import NotificationSkeleton from '../../../components/shared/NotificationSkeleton';
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { notificationService } from '../../../services/notificationService';
import { notificationManager } from '../../../services/notificationManager';
import type { Notification, NotificationType, NotificationStats } from '../../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { notificationColorMap, notificationNameMap } from '../../../utils/notificationTypeMappings';
import NotificationDetailModal from '../../../components/notifications/NotificationDetailModal';

const { RangePicker } = DatePicker;
const { Option } = Select;

const NotificationListPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // Only show loading on first load
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  // Filters
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);

  // Get user ID from localStorage or auth context
  const userId = localStorage.getItem('userId') || '';

  const componentId = useRef('notification-list-page');

  // Register with notification manager for centralized event handling
  useEffect(() => {
    if (!notificationManager.isReady() || !userId) return;

    notificationManager.register(componentId.current, {
      onNewNotification: () => {
        console.log('🔔 [NotificationListPage] New notification received via manager');
        // Silent reload when new notification arrives
        loadNotifications(false);
        loadStats();
      },
      onListUpdate: () => {
        console.log('🔄 [NotificationListPage] List update received via manager');
        // Reload when list updates from other components (mark as read, etc.)
        loadNotifications(false);
        loadStats();
      }
    });

    // Initial load
    loadNotifications(true);
    loadStats();

    return () => {
      notificationManager.unregister(componentId.current);
    };
  }, [userId, notificationManager.isReady()]);

  // Silent reload when filters change (after initial load)
  useEffect(() => {
    if (!initialLoading) {
      // Clear cache when filters change to prevent stale data
      notificationManager.clearCache();
      loadNotifications(false);
    }
  }, [currentPage, pageSize, unreadOnly, selectedType, dateRange]);

  /**
   * Load notifications
   * @param showLoading - Only show loading spinner on initial load
   */
  const loadNotifications = async (showLoading: boolean = false) => {
    if (showLoading) setInitialLoading(true);
    try {
      // Try to use cache first (for navigation from dropdown)
      const cache = notificationManager.getCache();
      if (cache && !showLoading) {
        console.log('📋 [NotificationListPage] Using cached data');
        setNotifications(cache.notifications);
        setTotal(cache.total);
        return;
      }

      const response = await notificationService.getNotifications({
        page: currentPage - 1,
        size: pageSize,
        unreadOnly,
        notificationType: selectedType,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
      });

      // Sort by createdAt descending
      const sortedNotifications = response.content.sort(
        (a: Notification, b: Notification) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(sortedNotifications);
      setTotal(response.totalElements);
      
      // Cache the results for other components
      notificationManager.setCache(sortedNotifications, response.totalElements);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      if (showLoading) setInitialLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await notificationService.getNotificationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Open modal immediately (optimistic update)
    setSelectedNotification({ ...notification, isRead: true });
    setDetailModalOpen(true);
    
    // Mark as read in background if unread (no loading, no blocking)
    if (!notification.isRead) {
      // Update local state immediately for instant UI feedback
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      
      // Update stats optimistically
      if (stats) {
        setStats({
          ...stats,
          unreadCount: Math.max(0, stats.unreadCount - 1),
          readCount: stats.readCount + 1,
        });
      }
      
      // Call API in background using notificationManager (automatically broadcasts to all components)
      notificationManager.markAsRead(notification.id)
        .catch(error => console.error('Failed to mark as read:', error));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAllAsRead) return;
    
    setMarkingAllAsRead(true);
    
    // Optimistic update - mark all as read in UI immediately
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (stats) {
      setStats({
        ...stats,
        unreadCount: 0,
        readCount: stats.totalCount,
      });
    }
    
    try {
      await notificationManager.markAllAsRead();
      message.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      message.error('Không thể đánh dấu tất cả là đã đọc');
      // Reload to restore correct state
      loadNotifications(false);
      loadStats();
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await loadNotifications(false);
      await loadStats();
      message.success('Đã làm mới danh sách thông báo');
    } catch (error) {
      console.error('Failed to refresh:', error);
      message.error('Không thể làm mới danh sách');
    } finally {
      setRefreshing(false);
    }
  };

  const getNotificationTypeColor = (type: NotificationType): string => {
    return notificationColorMap[type] || 'default';
  };

  const getNotificationTypeName = (type: NotificationType): string => {
    return notificationNameMap[type] || 'Thông báo';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellOutlined className="text-3xl text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 m-0">Thông báo của tôi</h1>
          </div>
          <Space>
            <Button 
              icon={<SyncOutlined />} 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Làm mới
            </Button>
            {stats && stats.unreadCount > 0 && (
              <Button
                type="primary"
                icon={markingAllAsRead ? <SyncOutlined spin /> : <CheckCircleOutlined />}
                onClick={handleMarkAllAsRead}
                loading={markingAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Tổng thông báo"
                value={stats.totalCount}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Chưa đọc"
                value={stats.unreadCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Đã đọc"
                value={stats.readCount}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Select
              placeholder="Lọc theo trạng thái"
              allowClear
              value={unreadOnly ? 'unread' : 'all'}
              onChange={(value) => {
                setUnreadOnly(value === 'unread');
                setCurrentPage(1);
              }}
              className="w-full"
            >
              <Option value="all">Tất cả</Option>
              <Option value="unread">Chưa đọc</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Lọc theo loại"
              allowClear
              value={selectedType}
              onChange={(value) => {
                setSelectedType(value);
                setCurrentPage(1);
              }}
              className="w-full"
            >
              <Option value="ORDER_STATUS_CHANGE">Cập nhật đơn hàng</Option>
              <Option value="PAYMENT_SUCCESS">Thanh toán thành công</Option>
              <Option value="PAYMENT_TIMEOUT">Hết hạn thanh toán</Option>
              <Option value="ORDER_REJECTION">Từ chối đơn hàng</Option>
              <Option value="DAMAGE">Hư hỏng hàng hóa</Option>
              <Option value="PENALTY">Phạt</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([
                    dates[0].format('YYYY-MM-DD'),
                    dates[1].format('YYYY-MM-DD'),
                  ]);
                } else {
                  setDateRange(undefined);
                }
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </Col>
        </Row>
      </Card>

      {/* Notification List */}
      <Card>
        {initialLoading || refreshing ? (
          <NotificationSkeleton count={5} showAvatar={true} />
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có thông báo"
            className="py-12"
          />
        ) : (
          <>
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
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  actions={[
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                    >
                      Xem chi tiết
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="relative">
                        <Badge
                          dot={!notification.isRead}
                          offset={[-5, 5]}
                          color="blue"
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              !notification.isRead
                                ? 'bg-blue-100 border-2 border-blue-300'
                                : 'bg-gray-100'
                            }`}
                          >
                            <BellOutlined
                              className={`text-xl ${
                                !notification.isRead
                                  ? 'text-blue-600'
                                  : 'text-gray-500'
                              }`}
                            />
                          </div>
                        </Badge>
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2 mb-1">
                        <Tag
                          color={getNotificationTypeColor(
                            notification.notificationType
                          )}
                          className="m-0"
                        >
                          {getNotificationTypeName(notification.notificationType)}
                        </Tag>
                        {!notification.isRead ? (
                          <Tag color="blue" className="m-0">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                              Chưa đọc
                            </span>
                          </Tag>
                        ) : (
                          <Tag color="default" className="m-0">
                            <CheckCircleOutlined className="mr-1" />
                            Đã đọc
                          </Tag>
                        )}
                        <span
                          className={`text-base ${
                            !notification.isRead
                              ? 'font-bold text-gray-900'
                              : 'font-medium text-gray-600'
                          }`}
                        >
                          {notification.title}
                        </span>
                      </div>
                    }
                    description={
                      <div className="space-y-2">
                        <p className={`text-sm mb-0 ${
                          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.description}
                        </p>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <ClockCircleOutlined />
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                                locale: vi,
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {/* Pagination */}
            <div className="mt-6 flex justify-center">
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                  }
                }}
                showSizeChanger
                showTotal={(total) => `Tổng ${total} thông báo`}
                pageSizeOptions={['10', '20', '50', '100']}
              />
            </div>
          </>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedNotification(null);
            // Don't reload - we already have optimistic update
            // Stats will be updated via WebSocket if needed
          }}
          userRole="CUSTOMER"
        />
      )}
    </div>
  );
};

export default NotificationListPage;
