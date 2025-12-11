import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  Search,
  Filter,
  User,
  Truck,
  Users,
  RefreshCw,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import userChatService from '@/services/chat/userChatService';
import type {
  ChatConversationResponse,
  ChatStatisticsResponse,
  ConversationType,
} from '@/models/UserChat';
import StaffChatPanel from './components/StaffChatPanel';
import UnifiedCustomerOrderModal from './components/UnifiedCustomerOrderModal';
import DriverOverviewModal from './components/DriverOverviewModal';

const StaffChatDashboard: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversationResponse[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationResponse | null>(null);
  const [statistics, setStatistics] = useState<ChatStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [customerOverviewId, setCustomerOverviewId] = useState<string | null>(null);
  const [driverOverviewId, setDriverOverviewId] = useState<string | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userChatService.getStaffConversations(filterType || undefined, 0, 50);
      setConversations(response.content);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await userChatService.getChatStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, []);

  // Search conversations
  const handleSearch = useCallback(async () => {
    if (!searchKeyword.trim()) {
      loadConversations();
      return;
    }
    setLoading(true);
    try {
      const results = await userChatService.searchConversations(searchKeyword);
      setConversations(results);
    } catch (error) {
      console.error('Failed to search conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, loadConversations]);

  useEffect(() => {
    loadConversations();
    loadStatistics();
  }, [loadConversations, loadStatistics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
      loadStatistics();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadConversations, loadStatistics]);

  const getConversationTypeIcon = (type: string) => {
    switch (type) {
      case 'CUSTOMER_SUPPORT':
        return <User size={16} className="text-blue-500" />;
      case 'DRIVER_SUPPORT':
        return <Truck size={16} className="text-green-500" />;
      case 'GUEST_SUPPORT':
        return <Users size={16} className="text-gray-500" />;
      default:
        return <MessageCircle size={16} />;
    }
  };

  const getConversationTypeLabel = (type: string) => {
    switch (type) {
      case 'CUSTOMER_SUPPORT':
        return 'Khách hàng';
      case 'DRIVER_SUPPORT':
        return 'Tài xế';
      case 'GUEST_SUPPORT':
        return 'Khách';
      default:
        return 'Khác';
    }
  };

  const formatLastMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-100">
      {/* Sidebar - Conversation List */}
      <div className="w-96 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle size={20} />
              Hỗ trợ trực tuyến
            </h1>
            <button
              onClick={() => {
                loadConversations();
                loadStatistics();
              }}
              className="p-1.5 hover:bg-blue-500 rounded"
              title="Làm mới"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-blue-500 rounded p-2 text-center">
                <div className="font-bold">{statistics.customerSupportCount}</div>
                <div className="opacity-80">Khách hàng</div>
              </div>
              <div className="bg-blue-500 rounded p-2 text-center">
                <div className="font-bold">{statistics.driverSupportCount}</div>
                <div className="opacity-80">Tài xế</div>
              </div>
              <div className="bg-blue-500 rounded p-2 text-center">
                <div className="font-bold">{statistics.totalUnreadMessages}</div>
                <div className="opacity-80">Chưa đọc</div>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="p-3 border-b space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search size={16} />
            </button>
          </div>

          <div className="flex gap-1">
            {['', 'CUSTOMER_SUPPORT', 'DRIVER_SUPPORT', 'GUEST_SUPPORT'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 px-2 py-1.5 text-xs rounded ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === '' ? 'Tất cả' : getConversationTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="animate-spin text-blue-600" size={24} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle size={48} className="mx-auto mb-2 opacity-30" />
              <p>Không có cuộc hội thoại nào</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {conv.initiatorImageUrl ? (
                      <img
                        src={conv.initiatorImageUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getConversationTypeIcon(conv.conversationType)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">
                        {conv.initiatorName || conv.guestName || 'Khách'}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {formatLastMessageTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {getConversationTypeIcon(conv.conversationType)}
                      <span className="text-xs text-gray-500">
                        {getConversationTypeLabel(conv.conversationType)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conv.lastMessagePreview || 'Chưa có tin nhắn'}
                    </p>
                    {conv.activeOrders && conv.activeOrders.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {conv.activeOrders.slice(0, 2).map((order) => (
                          <span
                            key={order.orderId}
                            className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded"
                          >
                            {order.orderCode}
                          </span>
                        ))}
                        {conv.activeOrders.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{conv.activeOrders.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <StaffChatPanel
            conversation={selectedConversation}
            staffId={user?.id || ''}
            onViewCustomerProfile={(id) => setCustomerOverviewId(id)}
            onViewDriverProfile={(id) => setDriverOverviewId(id)}
            onConversationClosed={() => {
              setSelectedConversation(null);
              loadConversations();
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
              <h2 className="text-xl font-medium mb-2">Chọn một cuộc hội thoại</h2>
              <p className="text-sm">Chọn cuộc hội thoại từ danh sách bên trái để bắt đầu hỗ trợ</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Overview Modal */}
      {customerOverviewId && (
        <UnifiedCustomerOrderModal
          customerId={customerOverviewId}
          onClose={() => setCustomerOverviewId(null)}
        />
      )}

      {/* Driver Overview Modal */}
      {driverOverviewId && (
        <DriverOverviewModal
          driverId={driverOverviewId}
          visible={!!driverOverviewId}
          onClose={() => setDriverOverviewId(null)}
        />
      )}
    </div>
  );
};

export default StaffChatDashboard;
