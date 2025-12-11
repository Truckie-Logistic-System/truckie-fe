import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  PictureOutlined,
  LoadingOutlined,
  MinusOutlined,
  BorderOutlined,
  UserOutlined,
  CarOutlined,
  TeamOutlined,
  SearchOutlined,
  InboxOutlined,
  ExportOutlined,
  PhoneOutlined,
  MailOutlined,
  LeftOutlined,
  InfoCircleOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Card, Image, Button } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getOrderStatusLabel } from '@/utils/statusHelpers';
import { debounce } from 'lodash';
import userChatService from '@/services/chat/userChatService';
import type {
  ChatConversationResponse,
  ChatUserMessageResponse,
  SendMessageRequest,
} from '@/models/UserChat';
import { ChatParticipantType } from '@/models/UserChat';
import { useNavigate } from 'react-router-dom';
import CustomerOverviewModal from '@/pages/Admin/Chat/components/CustomerOverviewModal';
import DriverOverviewModal from '@/pages/Admin/Chat/components/DriverOverviewModal';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { API_BASE_URL } from '@/config';

type FilterType = 'all' | 'customer' | 'driver' | 'guest';

const StaffUserChatWidget: React.FC = () => {
  // console.log('StaffUserChatWidget rendered');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<ChatConversationResponse[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationResponse | null>(null);
  const [messages, setMessages] = useState<ChatUserMessageResponse[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showCustomerOverview, setShowCustomerOverview] = useState(false);
  const [showDriverOverview, setShowDriverOverview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [wsConnected, setWsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const isOpenRef = useRef(isOpen);
  const isInputFocusedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastScrollTopRef = useRef(0);
  const manualScrollLockRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(0);
  const loadConversationsRef = useRef<() => void>(() => {});
  const navigate = useNavigate();

  // Notification sound with Web Audio API fallback
  const playNotificationSound = useCallback(() => {
    // Try to play the audio file first
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Audio file not available, using Web Audio API fallback:', error);
        // Fallback to Web Audio API beep
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // 800Hz beep
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (fallbackError) {
          console.log('Web Audio API also failed:', fallbackError);
        }
      });
    }
  }, []);

  const { user } = useAuth();
  const staffId = user?.id;

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const filterType = filter === 'all' ? undefined : 
        filter === 'customer' ? 'CUSTOMER_SUPPORT' : 
        filter === 'driver' ? 'DRIVER_SUPPORT' : 'GUEST_SUPPORT';
      
      const response = await userChatService.getStaffConversations(filterType, 0, 50);
      setConversations(response.content);
      
      // Calculate unread total
      const total = response.content.reduce((sum: number, c: ChatConversationResponse) => sum + (c.unreadCount || 0), 0);
      setUnreadTotal(total);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [filter]);

  // Keep ref updated for use in WebSocket callbacks
  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  // Load messages for selected conversation (without marking as read)
  const loadMessages = useCallback(async (skipLoading = false) => {
    if (!selectedConversation) return;
    
    // Only show loading on initial load, not on polling
    if (!skipLoading) {
      setLoading(true);
    }
    try {
      const response = await userChatService.getMessages(selectedConversation.id, 0, 100);
      setMessages(response.messages);
      // Note: Don't mark as read here - only mark when user interacts with input
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, [selectedConversation]);

  // Initialize WebSocket connection for real-time badge updates
  useEffect(() => {
    // console.log('Staff WebSocket useEffect triggered:', {
    //   staffId,
    //   apiBaseUrl: API_BASE_URL
    // });
    
    if (!staffId) {
      console.log('Staff WebSocket useEffect skipped - staffId is undefined');
      return;
    }

    // Get JWT token for authentication (consistent with useUserChat hook)
    const getAuthToken = () => {
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
      return token ? `Bearer ${token}` : '';
    };

    const wsUrl = `${API_BASE_URL}/ws`;
    // console.log('Staff WebSocket connecting to:', wsUrl);
    
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: getAuthToken(),
      },
      // debug: (str) => console.log('STOMP Debug:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      // console.log('Staff WebSocket connected, wsConnected will be set to true');
      setWsConnected(true);
      
      // Refresh unread count when WebSocket reconnects
      // This syncs with messages received while disconnected
      loadConversationsRef.current();
      
      // Log current state
      // console.log('Staff WebSocket onConnect - selectedConversation:', selectedConversation?.id);
      
      // Subscribe to staff new message notifications (for badge updates AND real-time updates)
      stompClient.subscribe('/topic/chat/staff/new-message', (message) => {
        try {
          const notification = JSON.parse(message.body);
          console.log('Received new message notification:', notification);
          
          // Increment unread count for non-staff messages with deduplication
          if (notification.message?.senderType !== 'STAFF') {
            const messageId = notification.message.id;
            const wasProcessed = processedMessageIds.current.has(messageId);
            
            if (!wasProcessed) {
              processedMessageIds.current.add(messageId);
              setUnreadTotal(prev => prev + 1);
              // Play notification sound for new messages
              playNotificationSound();
              
              // Refresh conversation list immediately to update last message preview
              loadConversationsRef.current();
            }
          }
        } catch (error) {
          console.error('Error parsing staff message notification:', error);
        }
      });
      
      // Subscribe to new conversation notifications
      stompClient.subscribe('/topic/chat/staff/new-conversation', (message) => {
        try {
          const newConversation = JSON.parse(message.body);
          console.log('Received new conversation notification:', newConversation);
          // Refresh conversation list to show new conversation
          loadConversationsRef.current();
        } catch (error) {
          console.error('Error parsing new conversation notification:', error);
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
      console.error('STOMP Error details:', {
        command: frame.command,
        headers: frame.headers,
        body: frame.body
      });
    };

    stompClient.onWebSocketError = (error) => {
      console.error('WebSocket Error:', error);
    };

    stompClient.onWebSocketClose = (event) => {
      console.error('WebSocket Closed:', event);
      setWsConnected(false);
    };

    // Set ref BEFORE activating to avoid race condition
    stompClientRef.current = stompClient;
    stompClient.activate();

    stompClient.onDisconnect = () => {
      console.log('Staff WebSocket disconnected');
      setWsConnected(false);
    };

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        setWsConnected(false);
      }
    };
  }, [staffId]);

  // Fetch initial unread count on mount (even when widget is closed)
  useEffect(() => {
    const fetchInitialUnreadCount = async () => {
      try {
        const count = await userChatService.getUnreadCount();
        setUnreadTotal(count);
      } catch (error) {
        console.error('Failed to fetch initial unread count:', error);
      }
    };
    
    fetchInitialUnreadCount();
    
    // Poll for unread count when widget is closed (WebSocket handles real-time when open)
    // Longer interval since WebSocket subscription handles real-time updates
    const unreadPolling = setInterval(fetchInitialUnreadCount, 10000); // 10 seconds
    
    return () => {
      clearInterval(unreadPolling);
    };
  }, []);

  // Polling for updates when widget is open (backup for WebSocket)
  // WebSocket handles real-time updates, polling is just a fallback
  useEffect(() => {
    if (isOpen) {
      loadConversations();
      
      // Longer polling interval since WebSocket handles real-time updates
      pollingRef.current = setInterval(() => {
        loadConversations();
        if (selectedConversation) {
          // Skip loading state on polling to avoid flickering
          loadMessages(true);
        }
      }, 15000); // 15 seconds - just a backup
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, loadConversations, selectedConversation, loadMessages]);

  // Mark messages as read when user interacts
  const markMessagesAsRead = useCallback(async () => {
    if (selectedConversation) {
      try {
        await userChatService.markAsRead(selectedConversation.id);
        console.log('Messages marked as read for conversation:', selectedConversation.id);
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    }
  }, [selectedConversation]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      // Clear old messages immediately to prevent showing stale data
      setMessages([]);
      setLoading(true);
      loadMessages();
      // Note: Don't mark as read here - only mark when user interacts with input
      // This prevents staff's sent messages from being marked as read immediately
    }
  }, [selectedConversation?.id]); // Only depend on id to avoid re-triggering

  // Subscribe to selected conversation for real-time messages
  useEffect(() => {
    // console.log('Subscription useEffect triggered:', {
    //   hasSelectedConversation: !!selectedConversation,
    //   wsConnected,
    //   hasStompClient: !!stompClientRef.current,
    //   stompConnected: stompClientRef.current?.connected,
    //   conversationId: selectedConversation?.id
    // });
    
    if (!selectedConversation || !wsConnected || !stompClientRef.current || !stompClientRef.current.connected) {
      // console.log('Subscription skipped - conditions not met');
      return;
    }

    const conversationId = selectedConversation.id;
    console.log('Subscribing to conversation messages:', conversationId);
    
    // Clear typing users when switching conversations
    setTypingUsers(new Map());

    // Subscribe to conversation messages
    const messageSubscription = stompClientRef.current.subscribe(
      `/topic/chat/conversation/${conversationId}`,
      (message) => {
        try {
          const newMessage = JSON.parse(message.body);
          console.log('Staff received real-time message:', newMessage);
          
          // Add message to list if not exists
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
          
          // If input is focused and message is NOT from staff, auto-mark as read
          // Don't mark as read for staff's own messages to avoid showing "read" immediately
          if (isInputFocusedRef.current && newMessage.senderType !== 'STAFF') {
            markMessagesAsRead();
          }
        } catch (error) {
          console.error('Error parsing conversation message:', error);
        }
      }
    );

    // Subscribe to typing indicators
    console.log('📝 Subscribing to typing indicators:', `/topic/chat/conversation/${conversationId}/typing`);
    const typingSubscription = stompClientRef.current.subscribe(
      `/topic/chat/conversation/${conversationId}/typing`,
      (message) => {
        try {
          const indicator = JSON.parse(message.body);
          console.log('📥 Staff received typing indicator:', {
            indicator,
            staffId,
            shouldFilter: indicator.senderId === staffId,
            senderType: indicator.senderType
          });
          
          // Don't show typing from self
          if (indicator.senderId === staffId) {
            console.log('Filtering out own typing indicator');
            return;
          }
          
          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (indicator.isTyping) {
              next.set(indicator.senderId || 'user', indicator.senderName || 'Người dùng');
              console.log('✅ Added typing user:', indicator.senderName);
            } else {
              next.delete(indicator.senderId || 'user');
              console.log('❌ Removed typing user:', indicator.senderId);
            }
            return next;
          });
        } catch (error) {
          console.error('Error parsing typing indicator:', error);
        }
      }
    );
    console.log('✅ Typing subscription created');

    // Subscribe to read status updates
    const readSubscription = stompClientRef.current.subscribe(
      `/topic/chat/conversation/${conversationId}/read`,
      (message) => {
        try {
          const readStatus = JSON.parse(message.body);
          console.log('Staff received read status:', readStatus);
          
          // Only mark staff's messages as read when CUSTOMER or DRIVER reads them
          // Ignore read status from STAFF (self) to prevent flickering
          const readerType = readStatus.readerType;
          if (readerType === 'CUSTOMER' || readerType === 'DRIVER') {
            setMessages((prev) => prev.map(msg => {
              // Only mark staff's own messages as read
              if (msg.senderType === 'STAFF' && !msg.isRead) {
                return { ...msg, isRead: true };
              }
              return msg;
            }));
          }
        } catch (error) {
          console.error('Error parsing read status:', error);
        }
      }
    );

    return () => {
      console.log('Unsubscribing from conversation:', conversationId);
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      readSubscription.unsubscribe();
      setTypingUsers(new Map());
    };
  }, [selectedConversation, staffId, markMessagesAsRead, wsConnected]);

  // Update isOpen ref whenever isOpen state changes
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Track if this is initial load for the current conversation
  const isInitialLoadRef = useRef(true);
  
  // Reset initial load flag when conversation changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    lastMessageCountRef.current = 0;
  }, [selectedConversation?.id]);

  // Scroll to bottom BEFORE paint using useLayoutEffect - this prevents flash of top content
  useLayoutEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0 || loading) return;
    
    // Initial load or widget reopen - scroll immediately before browser paints
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      lastMessageCountRef.current = messages.length;
      setShowScrollToTop(false);
      setShowScrollToBottom(false);
    }
  }, [messages, loading]);

  // Handle widget reopen - scroll to bottom
  useLayoutEffect(() => {
    if (isOpen && selectedConversation && messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [isOpen]);

  // Auto-scroll when typing indicator appears (focus on typing)
  useEffect(() => {
    if (typingUsers.size > 0 && messagesContainerRef.current && !isUserScrolling) {
      // Smooth scroll to bottom when someone starts typing
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [typingUsers.size, isUserScrolling]);

  // Auto-scroll on new messages (after initial load)
  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0 || loading) return;
    
    // New messages arrived after initial load
    if (messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
      if (manualScrollLockRef.current) {
        setShowScrollToBottom(true);
      } else {
        messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
      }
      lastMessageCountRef.current = messages.length;
    }
  }, [messages, loading]);

  // Handle scroll events to show/hide scroll buttons and detect user scrolling
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Only show scroll buttons if content is actually scrollable
    if (scrollHeight <= clientHeight) {
      setShowScrollToTop(false);
      setShowScrollToBottom(false);
      return;
    }
    
    // Detect if user is scrolling up (reading old messages)
    if (scrollTop < lastScrollTopRef.current - 10) {
      setIsUserScrolling(true);
    }
    
    // Reset user scrolling flag and clear manual scroll lock when near bottom
    if (distanceFromBottom < 50) {
      setIsUserScrolling(false);
      setShowScrollToBottom(false);
      
      // Clear manual scroll lock when user scrolls near bottom
      if (manualScrollLockRef.current) {
        clearTimeout(manualScrollLockRef.current);
        manualScrollLockRef.current = null;
      }
    }
    
    lastScrollTopRef.current = scrollTop;
    
    // Show scroll to top when scrolled down more than 200px
    setShowScrollToTop(scrollTop > 200);
    
    // Show scroll to bottom when not near bottom (more than 150px away)
    setShowScrollToBottom(distanceFromBottom > 150);
  }, []);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    if (messagesContainerRef.current) {
      setIsUserScrolling(true);
      
      // Clear any existing manual scroll lock
      if (manualScrollLockRef.current) {
        clearTimeout(manualScrollLockRef.current);
      }
      
      // Set manual scroll lock for 3 seconds to prevent auto-scroll
      manualScrollLockRef.current = setTimeout(() => {
        manualScrollLockRef.current = null;
        // When lock expires, if we're not near bottom, show scroll to bottom button
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
          if (distanceFromBottom > 150) {
            setShowScrollToBottom(true);
          }
        }
      }, 3000);
      
      messagesContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      setIsUserScrolling(false);
      
      // Clear manual scroll lock when user explicitly scrolls to bottom
      if (manualScrollLockRef.current) {
        clearTimeout(manualScrollLockRef.current);
        manualScrollLockRef.current = null;
      }
      
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollToBottom(false);
    }
  }, []);

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending || !selectedConversation || !staffId) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);
    
    // Note: Don't mark as read when sending - only mark when customer/driver reads
    // This was causing staff's messages to show as "read" immediately

    try {
      const request: SendMessageRequest = {
        conversationId: selectedConversation.id,
        senderId: staffId,
        content,
        messageType: 'TEXT',
      };
      const newMessage = await userChatService.sendMessage(selectedConversation.id, request);
      // Prevent duplicate: check if message already exists
      setMessages((prev) => {
        const exists = prev.some(m => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageInput(content);
    } finally {
      setSending(false);
      // Keep focus on input after sending message for continuous chatting
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !staffId) return;

    setIsUploading(true);
    try {
      const imageUrl = await userChatService.uploadImage(file, selectedConversation.id);
      const request: SendMessageRequest = {
        conversationId: selectedConversation.id,
        senderId: staffId,
        content: '',
        messageType: 'IMAGE',
        imageUrl,
      };
      const newMessage = await userChatService.sendMessage(selectedConversation.id, request);
      // Prevent duplicate: check if message already exists
      setMessages((prev) => {
        const exists = prev.some(m => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm', { locale: vi });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    }
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'CUSTOMER_SUPPORT':
        return <UserOutlined style={{ fontSize: '16px', color: '#1890ff' }} />;
      case 'DRIVER_SUPPORT':
        return <CarOutlined style={{ fontSize: '16px', color: '#52c41a' }} />;
      default:
        return <TeamOutlined style={{ fontSize: '16px', color: '#8c8c8c' }} />;
    }
  };

  const getConversationLabel = (conv: ChatConversationResponse) => {
    if (conv.conversationType === 'CUSTOMER_SUPPORT') {
      return conv.initiatorName || 'Khách hàng';
    } else if (conv.conversationType === 'DRIVER_SUPPORT') {
      return conv.initiatorName || 'Tài xế';
    } else {
      return conv.guestName || 'Khách vãng lai';
    }
  };

  const isOwnMessage = (senderId?: string) => {
    return senderId === staffId;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery) {
      const label = getConversationLabel(conv).toLowerCase();
      return label.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Navigate to order detail
  const handleViewOrder = (orderId: string) => {
    navigate(`/staff/orders/${orderId}`);
    setIsOpen(false);
  };

  // Get latest order from active orders
  const getLatestOrder = (conv: ChatConversationResponse) => {
    if (conv.activeOrders && conv.activeOrders.length > 0) {
      return conv.activeOrders[0];
    }
    return null;
  };

  // Debounced typing indicator for staff
  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (selectedConversation && stompClientRef.current?.connected) {
        const indicator = {
          senderId: staffId,
          senderName: user?.username || 'Staff',
          senderType: 'STAFF',
          isTyping: false,
        };
        stompClientRef.current.publish({
          destination: `/app/user-chat.typing/${selectedConversation.id}`,
          body: JSON.stringify(indicator),
        });
      }
    }, 1000),
    [selectedConversation, staffId, user?.username]
  );

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator if connected
    if (selectedConversation && stompClientRef.current?.connected) {
      const indicator = {
        senderId: staffId,
        senderName: user?.username || 'Staff',
        senderType: 'STAFF',
        isTyping: true,
      };
      
      console.log('Staff sending typing indicator:', indicator);
      stompClientRef.current.publish({
        destination: `/app/user-chat.typing/${selectedConversation.id}`,
        body: JSON.stringify(indicator),
      });
      
      debouncedStopTyping();
    }
  };

  const isLastReadOwnMessage = (msg: ChatUserMessageResponse, index: number) => {
    if (!msg.isRead) return false;
    
    const isOwn = isOwnMessage(msg.senderId || undefined);
    if (!isOwn) return false;
    
    // Check if there are any more own messages after this one that are also read
    for (let i = index + 1; i < messages.length; i++) {
      const nextMsg = messages[i];
      const nextIsOwn = isOwnMessage(nextMsg.senderId || undefined);
      if (nextIsOwn && nextMsg.isRead) {
        return false; // There's a later read message from the same sender
      }
    }
    
    return true; // This is the last read message from this sender
  };

  // Always render the button, modal visibility controlled by isOpen state
  return (
    <>
      <Button
        type="primary"
        shape="circle"
        onClick={() => setIsOpen(true)}
        className="fixed shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-110"
        style={{
          width: '64px',
          height: '64px',
          fontSize: '28px',
          zIndex: 998,
          background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
          bottom: '1rem',
          right: '1rem',
          border: 'none'
        }}
        title="Hỗ trợ khách hàng"
        icon={<MessageOutlined style={{ fontSize: '24px', color: 'white' }} />}
      >
        {unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </Button>

      {/* Modal - only render when isOpen is true */}
      {isOpen && (
        <Card
          className={`fixed shadow-2xl transition-all duration-300 ${
            isMinimized ? 'w-80 h-14' : 'w-[480px] h-[650px] max-h-[80vh]'
          }`}
          style={{
            zIndex: 999,
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            bottom: '1rem',
            right: 'calc(1rem + 80px)', // Open to the left of buttons
          }}
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        >
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageOutlined style={{ fontSize: '20px', color: 'white' }} />
          <div>
            <h3 className="font-semibold text-sm">Hỗ trợ khách hàng</h3>
            {!isMinimized && (
              <p className="text-xs opacity-80">
                {conversations.length} cuộc hội thoại
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="text"
            icon={isMinimized ? <BorderOutlined style={{ fontSize: '16px' }} /> : <MinusOutlined style={{ fontSize: '16px' }} />}
            className="text-white hover:bg-white/20"
            size="middle"
            onClick={() => setIsMinimized(!isMinimized)}
          />
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: '16px' }} />}
            className="text-white hover:bg-white/20"
            size="middle"
            onClick={() => setIsOpen(false)}
          />
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List */}
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col">
              {/* Search & Filter */}
              <div className="p-3 border-b space-y-2">
                <div className="relative">
                  <SearchOutlined style={{ fontSize: '16px', color: '#bfbfbf' }} className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo tên người dùng..."
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-1">
                  {(['all', 'customer', 'driver', 'guest'] as FilterType[]).map((f) => (
                    <Button
                      key={f}
                      type={filter === f ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setFilter(f)}
                      className={filter === f ? 'bg-green-600 border-green-600' : 'text-green-600 border-green-200 hover:border-green-400'}
                    >
                      {f === 'all' ? 'Tất cả' : f === 'customer' ? 'Khách hàng' : f === 'driver' ? 'Tài xế' : 'Khách vãng lai'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <MessageOutlined style={{ fontSize: '40px', color: '#1890ff' }} className="mb-2 opacity-30" />
                    <p className="text-sm">Không có cuộc hội thoại nào</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const latestOrder = getLatestOrder(conv);
                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          console.log('Staff selecting conversation:', {
                            id: conv.id,
                            label: getConversationLabel(conv),
                            unreadCount: conv.unreadCount
                          });
                          setSelectedConversation(conv);
                        }}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          conv.unreadCount > 0 ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {conv.initiatorImageUrl ? (
                              <img
                                src={conv.initiatorImageUrl}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <UserOutlined 
                              style={{ 
                                fontSize: '20px', 
                                color: '#666',
                                display: conv.initiatorImageUrl ? 'none' : 'flex'
                              }} 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {getConversationLabel(conv)}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {conv.lastMessagePreview || 'Chưa có tin nhắn'}
                            </p>
                            {/* Show Order Code if Customer has active order */}
                            {conv.conversationType === 'CUSTOMER_SUPPORT' && latestOrder && (
                              <div className="flex items-center gap-1 mt-1">
                                <InboxOutlined style={{ fontSize: '12px', color: '#fa8c16' }} />
                                <span className="text-xs text-orange-600 font-medium">
                                  {latestOrder.orderCode}
                                </span>
                              </div>
                            )}
                            {/* Show Tracking Code if Driver */}
                            {conv.conversationType === 'DRIVER_SUPPORT' && conv.currentTrackingCode && (
                              <div className="flex items-center gap-1 mt-1">
                                <CarOutlined style={{ fontSize: '12px', color: '#52c41a' }} />
                                <span className="text-xs text-green-600 font-medium">
                                  {conv.currentTrackingCode}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {conv.lastMessageAt && formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            // Chat Panel
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-3 border-b flex items-center gap-3 flex-shrink-0 bg-gray-50">
                <Button
                  type="text"
                  icon={<LeftOutlined style={{ fontSize: '16px' }} />}
                  className="hover:bg-gray-200"
                  size="middle"
                  onClick={() => setSelectedConversation(null)}
                />
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {selectedConversation.initiatorImageUrl ? (
                    <img
                      src={selectedConversation.initiatorImageUrl}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <UserOutlined 
                    style={{ 
                      fontSize: '18px', 
                      color: '#666',
                      display: selectedConversation.initiatorImageUrl ? 'none' : 'flex'
                    }} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {getConversationLabel(selectedConversation)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.conversationType === 'CUSTOMER_SUPPORT'
                      ? 'Khách hàng'
                      : selectedConversation.conversationType === 'DRIVER_SUPPORT'
                      ? 'Tài xế'
                      : 'Khách vãng lai'}
                  </p>
                </div>
                {/* Info button for customer and driver chats (not guest) */}
                {selectedConversation.conversationType !== 'GUEST_SUPPORT' && selectedConversation.initiatorId && (
                  <Button
                    type="text"
                    icon={<InfoCircleOutlined style={{ fontSize: '16px' }} />}
                    onClick={() => {
                      if (selectedConversation.conversationType === 'CUSTOMER_SUPPORT') {
                        setShowCustomerOverview(true);
                      } else if (selectedConversation.conversationType === 'DRIVER_SUPPORT') {
                        setShowDriverOverview(true);
                      }
                    }}
                    className="hover:bg-gray-200"
                    size="middle"
                    title={selectedConversation.conversationType === 'CUSTOMER_SUPPORT' ? "Xem thông tin khách hàng" : "Xem thông tin tài xế"}
                  />
                )}
              </div>

              {/* Order/Tracking Info Banner */}
              {selectedConversation.conversationType === 'CUSTOMER_SUPPORT' && 
               selectedConversation.activeOrders && 
               selectedConversation.activeOrders.length > 0 && (
                <div className="px-3 py-2 bg-orange-50 border-b flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <InboxOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />
                    <span className="text-sm text-orange-700 font-medium">Đơn hàng gần đây:</span>
                  </div>
                  {(() => {
                    // Get latest order by createdAt
                    const sortedOrders = [...selectedConversation.activeOrders].sort((a, b) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    const latestOrder = sortedOrders[0];
                    return (
                      <div 
                        className="flex flex-col gap-1 bg-orange-100 rounded-lg px-3 py-2 cursor-pointer hover:bg-orange-200 transition-colors"
                        onClick={() => navigate(`/staff/orders/${latestOrder.orderId}`)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-orange-800 text-sm font-medium flex items-center gap-1">
                            <ExportOutlined style={{ fontSize: '12px' }} />
                            {latestOrder.orderCode}
                          </span>
                          <span className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded text-xs font-medium">
                            {getOrderStatusLabel(latestOrder.status)}
                          </span>
                        </div>
                        {latestOrder.modifiedAt && (
                          <span className="text-xs text-orange-600">
                            Cập nhật: {format(new Date(latestOrder.modifiedAt), 'HH:mm dd/MM', { locale: vi })}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tracking Code for Driver - Clickable to open Vehicle Assignment Detail */}
              {selectedConversation.conversationType === 'DRIVER_SUPPORT' && 
               selectedConversation.currentTrackingCode && selectedConversation.currentVehicleAssignmentId && (
                <div 
                  className="px-3 py-2 bg-green-50 border-b flex-shrink-0 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => navigate(`/staff/vehicle-assignments/${selectedConversation.currentVehicleAssignmentId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CarOutlined style={{ fontSize: '14px', color: '#52c41a' }} />
                      <span className="text-xs text-green-700">Chuyến xe gần đây:</span>
                      <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs font-mono font-semibold flex items-center gap-1">
                        {selectedConversation.currentTrackingCode}
                        <InfoCircleOutlined style={{ fontSize: '10px' }} />
                      </span>
                    </div>
                    {selectedConversation.trackingModifiedAt && (
                      <span className="text-xs text-green-600">
                        Cập nhật: {format(new Date(selectedConversation.trackingModifiedAt), 'HH:mm dd/MM', { locale: vi })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div 
                ref={messagesContainerRef} 
                className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 relative" 
                style={{ minHeight: 0 }} 
                onScroll={handleScroll}
              >
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <LoadingOutlined style={{ fontSize: '28px', color: '#52c41a' }} spin />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageOutlined style={{ fontSize: '36px', color: '#1890ff' }} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có tin nhắn nào</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const isOwn = isOwnMessage(msg.senderId || undefined);
                      const showDate =
                        index === 0 ||
                        formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);

                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <div className="text-center text-xs text-gray-400 my-2">
                              {formatDate(msg.createdAt)}
                            </div>
                          )}
                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%]`}>
                              {!isOwn && msg.senderType !== ChatParticipantType.SYSTEM && (
                                <p className="text-xs text-gray-500 mb-0.5 ml-1">
                                  {msg.senderName || 'Người dùng'}
                                </p>
                              )}
                              <div
                                className={`px-3 py-2 rounded-xl text-sm ${
                                  isOwn
                                    ? 'bg-green-600 text-white rounded-br-sm'
                                    : msg.senderType === ChatParticipantType.SYSTEM
                                    ? 'bg-gray-200 text-gray-600 italic text-center'
                                    : 'bg-white text-gray-900 border rounded-bl-sm shadow-sm'
                                }`}
                              >
                                {msg.imageUrl && !msg.content ? (
                                  <div className="message-image-only">
                                    <Image
                                      src={msg.imageUrl}
                                      alt="Chat image"
                                      className="max-w-[200px] max-h-[200px] rounded cursor-pointer"
                                      preview={{
                                        mask: 'Xem ảnh lớn',
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    {msg.imageUrl && (
                                      <div className="message-image-container mb-1">
                                        <Image
                                          src={msg.imageUrl}
                                          alt="Chat image"
                                          className="max-w-[200px] max-h-[200px] rounded cursor-pointer"
                                          preview={{
                                            mask: 'Xem ảnh lớn',
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    )}
                                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                                  </>
                                )}
                              </div>
                              <p className={`text-xs text-gray-400 mt-0.5 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                                {formatTime(msg.createdAt)}
                                {isLastReadOwnMessage(msg, index) && ' · Đã xem'}
                              </p>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 px-3 py-2 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Đang nhập...
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Floating Scroll Buttons - positioned above input area */}
              {(showScrollToTop || showScrollToBottom) && (
                <div className="flex justify-center gap-2 py-1.5 bg-gray-50/80 backdrop-blur-sm border-t border-gray-100">
                  {showScrollToTop && (
                    <Button
                      type="default"
                      size="small"
                      onClick={scrollToTop}
                      className="shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                      style={{
                        borderRadius: '16px',
                        fontSize: '12px',
                        height: '28px',
                        padding: '0 12px',
                      }}
                      title="Cuộn lên đầu"
                    >
                      <UpOutlined style={{ fontSize: '10px' }} />
                      <span>Lên đầu</span>
                    </Button>
                  )}
                  {showScrollToBottom && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={scrollToBottom}
                      className="shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                      style={{
                        borderRadius: '16px',
                        fontSize: '12px',
                        height: '28px',
                        padding: '0 12px',
                        background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                        border: 'none'
                      }}
                      title="Cuộn xuống cuối"
                    >
                      <DownOutlined style={{ fontSize: '10px' }} />
                      <span>Xuống cuối</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t bg-white rounded-b-xl flex-shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="text"
                    icon={isUploading ? <LoadingOutlined spin style={{ fontSize: '18px' }} /> : <PictureOutlined style={{ fontSize: '18px' }} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || sending}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    size="large"
                    title="Gửi hình ảnh"
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                      isInputFocusedRef.current = true;
                      markMessagesAsRead();
                    }}
                    onBlur={() => {
                      isInputFocusedRef.current = false;
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={sending}
                  />
                  <Button
                    type="primary"
                    icon={sending ? <LoadingOutlined spin style={{ fontSize: '18px' }} /> : <SendOutlined style={{ fontSize: '18px' }} />}
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending}
                    className="bg-green-600 hover:bg-green-700 border-green-600"
                    size="large"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        
        {/* Customer Overview Modal */}
        {showCustomerOverview && selectedConversation?.initiatorId && (
          <CustomerOverviewModal
            customerId={selectedConversation.initiatorId}
            onClose={() => setShowCustomerOverview(false)}
          />
        )}
        
        {/* Driver Overview Modal */}
        {showDriverOverview && selectedConversation?.initiatorId && (
          <DriverOverviewModal
            driverId={selectedConversation.initiatorId}
            visible={showDriverOverview}
            onClose={() => setShowDriverOverview(false)}
          />
        )}
        </Card>
      )}
    </>
  );
};

export default StaffUserChatWidget;
