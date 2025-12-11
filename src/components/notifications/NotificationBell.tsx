import React, { useState, useEffect, useRef } from 'react';
import { Badge, Popover } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import NotificationDropdown from './NotificationDropdown';
import { notificationManager } from '../../services/notificationManager';
import { playNotificationSound, NotificationSoundType } from '../../utils/notificationSound';
import './NotificationBell.css';

interface NotificationBellProps {
  userId: string;
  userRole: 'STAFF' | 'CUSTOMER';
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, userRole }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const componentId = useRef('notification-bell');

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        if (!userId) {
          console.warn('[NotificationBell] No userId provided');
          return;
        }

        // Initialize notification manager
        await notificationManager.initialize(userId, userRole);
        
        // Register callbacks
        notificationManager.register(componentId.current, {
          onNewNotification: (notification) => {
            // Play sound and show animation
            playNotificationSound(NotificationSoundType.INFO);
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 3000);
            
            // Immediately increment badge count for instant UI feedback
            setUnreadCount(prev => {
              const newCount = prev + 1;
              return newCount;
            });
            
            // Trigger dropdown refresh
            setRefreshTrigger(prev => prev + 1);
          },
          onStatsUpdate: (stats) => {
            setUnreadCount(stats.unreadCount);
          },
          onListUpdate: () => {
            // No-op: stats will be updated via onStatsUpdate callback
          }
        });
        
        // Load initial stats
        const stats = await notificationManager.getStats();
        setUnreadCount(stats.unreadCount);
        
        // Play animation on initial load if there are unread notifications
        if (stats.unreadCount > 0) {
          // console.log('🔔 [NotificationBell] Initial load: ' + stats.unreadCount + ' unread notifications');
          setHasNewNotification(true);
          setTimeout(() => setHasNewNotification(false), 3000);
        }
        
      } catch (error) {
        console.error('❌ [NotificationBell] Failed to initialize notifications:', error);
        // Still show the bell even if manager fails
      }
    };

    initializeNotifications();

    return () => {
      // console.log('🔔 [NotificationBell] Cleanup: unregistering...');
      notificationManager.unregister(componentId.current);
    };
  }, [userId, userRole]);

  const handleOpenChange = (visible: boolean) => {
    setOpen(visible);
    if (!visible) {
      // Reload stats when closing dropdown
      notificationManager.broadcastStatsUpdate();
    }
  };

  return (
    <Popover
      content={
        <NotificationDropdown
          userId={userId}
          userRole={userRole}
          onClose={() => setOpen(false)}
          onNotificationRead={() => notificationManager.broadcastStatsUpdate()}
          refreshTrigger={refreshTrigger}
        />
      }
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      overlayClassName="notification-popover"
      overlayStyle={{ 
        width: 420,
        maxWidth: '90vw',
        paddingTop: 8,
      }}
      arrow={{ pointAtCenter: true }}
    >
      <div
        ref={bellRef}
        className="cursor-pointer relative flex items-center"
        style={{ height: '32px' }}
      >
        <BellOutlined 
          className={`text-gray-700 hover:text-blue-600 transition-colors ${
            hasNewNotification ? 'text-blue-600 animate-shake' : ''
          }`}
          style={{ fontSize: '20px' }}
        />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
            style={{ fontSize: '10px', lineHeight: '18px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </Popover>
  );
};

export default NotificationBell;
