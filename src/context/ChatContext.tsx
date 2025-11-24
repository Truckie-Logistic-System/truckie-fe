import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { Client } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "@/config/env";

import type {
  ChatMessageDTO,
  MessageRequest,
} from "@/models/Chat";
import type { CreateRoomResponse } from "@/models/Room";
import {
  mapChatMessageDTOArrayToUI,
  mapChatMessageDTOToUI,
  type ChatMessage,
} from "@/utils/chatMapper";
import roomService from "@/services/room/roomService";
import chatService from "@/services/chat/chatService";
import { useAuth } from "@/context/AuthContext";

export interface ChatConversation {
  id: string;
  roomId: string;
  participants: CreateRoomResponse["participants"];
  status: string;
  type?: string;
  messages: ChatMessageDTO[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface SupportRoom {
  roomId: string;
  orderId: string | null;
  participants: Array<{
    userId: string;
    roleName: string;
  }>;
  status: string;
  type: "SUPPORT" | "SUPPORTED";
  customerName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface ChatContextType {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  unreadCount: number;
  isOpen: boolean;
  isMinimized: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  uiMessages: ChatMessage[];
  setActiveConversation: (conversation: ChatConversation | null) => void;
  setChatMessages: (messages: ChatMessageDTO[]) => void;
  setUIChatMessages: (messages: ChatMessage[]) => void;
  addUIChatMessage: (message: ChatMessage) => void;
  sendMessage: (request: MessageRequest) => void;
  markAsRead: (conversationId: string) => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  connectWebSocket: (userId: string, roomId: string) => void;
  disconnectWebSocket: () => void;
  initChat: (userId: string) => Promise<void>;
  openChat: (userId: string, roomId: string) => Promise<void>;
  loadMoreMessages: (roomId: string) => Promise<void>;
  supportRooms: SupportRoom[];
  loadingRooms: boolean;
  fetchSupportRooms: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  setActiveRoom: (room: SupportRoom | null) => void;
  activeRoom: SupportRoom | null;
  loadMessagesForRoom: (roomId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context)
    throw new Error("useChatContext must be used within a ChatProvider");
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  isStaff?: boolean;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatConversation | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [uiMessages, setUiMessages] = useState<ChatMessage[]>([]);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null); // Track subscription
  const currentRoomIdRef = useRef<string | null>(null); // Track current room
  const [supportRooms, setSupportRooms] = useState<SupportRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [activeRoom, setActiveRoom] = useState<SupportRoom | null>(null);
  const { user } = useAuth();

  // UI Messages Management
  const setUIChatMessages = useCallback((messages: ChatMessage[]) => {
    const sortedMessages = messages.sort((a, b) => {
      const aTime = parseInt(a.timestamp);
      const bTime = parseInt(b.timestamp);
      return aTime - bTime;
    });
    setUiMessages(sortedMessages);
  }, []);

  // Load messages for a specific room
  const loadMessagesForRoom = async (roomId: string) => {
    if (!user) return;

    try {
      connectWebSocket(user.id, roomId);
      const chatPage = await chatService.getMessages(roomId, 20);
      const uiMessages = mapChatMessageDTOArrayToUI(chatPage.messages, user.id);
      setUIChatMessages(uiMessages);

      const room = supportRooms.find((r) => r.roomId === roomId);
      if (room) {
        const roomInfo = {
          id: room.roomId,
          roomId: room.roomId,
          participants: room.participants,
          status: room.status.toLowerCase(),
          messages: chatPage.messages,
          lastMessage: chatPage.messages.at(-1)?.content || "",
          lastMessageTime:
            chatPage.messages.at(-1)?.createAt?.seconds?.toString() || "",
          unreadCount: room.unreadCount || 0,
        };

        if (
          !activeConversation ||
          activeConversation.roomId !== roomInfo.roomId ||
          activeConversation.lastMessageTime !== roomInfo.lastMessageTime
        ) {
          setActiveConversation(roomInfo);
        }
      }
    } catch (error) {
      console.error("❌ loadMessagesForRoom() error:", error);
    }
  };

  const fetchSupportRooms = useCallback(async () => {
    if (!user) return;

    setLoadingRooms(true);
    try {
      const rooms = await roomService.getListSupportRoomsForStaff();

      const supportRoomsData: SupportRoom[] = rooms.map((room) => ({
        ...room,
        type:
          room.type === "SUPPORT" || room.type === "SUPPORTED"
            ? (room.type as "SUPPORT" | "SUPPORTED")
            : "SUPPORT",
      }));

      const sortedRooms = supportRoomsData.sort((a, b) => {
        if (a.type === "SUPPORT" && b.type !== "SUPPORT") return -1;
        if (a.type !== "SUPPORT" && b.type === "SUPPORT") return 1;
        return 0;
      });

      setSupportRooms(sortedRooms);
    } catch (error) {
      console.error("Failed to fetch support rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  }, [user]);

  const joinRoom = async (roomId: string) => {
    if (!user) return;

    

    try {
      const success = await roomService.joinRoom(roomId, user.id);
      

      if (success) {
        setSupportRooms((prev) =>
          prev.map((room) =>
            room.roomId === roomId ? { ...room, type: "SUPPORTED" } : room
          )
        );
        connectWebSocket(user.id, roomId);
        

        setIsOpen(true);
        setIsMinimized(false);

        const chatPage = await chatService.getMessages(roomId, 20);
        const uiMessages = mapChatMessageDTOArrayToUI(chatPage.messages, user.id);
        setUIChatMessages(uiMessages);
        const roomInfo = {
          id: roomId,
          roomId: roomId,
          participants: [{ userId: user.id, roleName: user.role }],
          status: "active",
          messages: chatPage.messages,
          lastMessage: chatPage.messages[chatPage.messages.length - 1]?.content || "",
          lastMessageTime:
            chatPage.messages[chatPage.messages.length - 1]?.createAt?.seconds?.toString() || "",
          unreadCount: 0,
        };
        setActiveConversation(roomInfo);
      }
    } catch (error) {
      console.error("❌ joinRoom() error:", error);
    }
  };

  const timestampToMillis = (timestamp: any): number => {
    if (!timestamp) return 0;
    if (typeof timestamp === "number") return timestamp;
    if (typeof timestamp === "string") return Number(timestamp) || 0;
    if (
      typeof timestamp === "object" &&
      typeof timestamp.seconds === "number"
    ) {
      return (
        timestamp.seconds * 1000 + Math.floor((timestamp.nanos || 0) / 1000000)
      );
    }
    return 0;
  };

  const buildConversation = useCallback(
    (
      room: CreateRoomResponse,
      messages: ChatMessageDTO[]
    ): ChatConversation => {
      const sortedMessages = messages.sort((a, b) => {
        const aTime = timestampToMillis(a.createAt);
        const bTime = timestampToMillis(b.createAt);
        return aTime - bTime;
      });

      const lastMessage =
        sortedMessages.length > 0
          ? sortedMessages[sortedMessages.length - 1]
          : null;

      return {
        id: room.roomId,
        roomId: room.roomId,
        participants: room.participants,
        status: room.status,
        type: room.type,
        messages: sortedMessages,
        lastMessage: lastMessage?.content || "",
        lastMessageTime: lastMessage
          ? timestampToMillis(lastMessage.createAt).toString()
          : "",
        unreadCount: 0,
      };
    },
    [timestampToMillis]
  );

  const addUIChatMessage = useCallback((message: ChatMessage) => {
    setUiMessages((prev) => {
      // Check duplicate by ID
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) return prev;

      // ✅ FIX: Replace temp message with real message from server
      // If this is a real message (not temp-*), check if there's a temp message with similar content and timestamp
      if (!message.id.startsWith('temp-')) {
        const tempIndex = prev.findIndex(msg => 
          msg.id.startsWith('temp-') && 
          msg.content === message.content &&
          Math.abs(parseInt(msg.timestamp) - parseInt(message.timestamp)) < 5000 // Within 5 seconds
        );
        
        if (tempIndex !== -1) {
          // Replace temp message with real message
          const updated = [...prev];
          updated[tempIndex] = message;
          return updated.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
        }
      }

      const updated = [...prev, message];
      return updated.sort((a, b) => {
        const aTime = parseInt(a.timestamp);
        const bTime = parseInt(b.timestamp);
        return aTime - bTime;
      });
    });
  }, []);

  const handleNewMessage = useCallback(
    (msg: ChatMessageDTO, roomId: string) => {
      const currentUserId = sessionStorage.getItem("userId") || "";

      setConversations((prev) =>
        prev.map((conv) =>
          conv.roomId === roomId
            ? {
              ...conv,
              messages: [...conv.messages, msg].sort((a, b) => {
                const aTime = timestampToMillis(a.createAt);
                const bTime = timestampToMillis(b.createAt);
                return aTime - bTime;
              }),
              lastMessage: msg.content,
              lastMessageTime: timestampToMillis(msg.createAt).toString(),
              unreadCount:
                activeConversation?.roomId === roomId && isOpen
                  ? conv.unreadCount
                  : conv.unreadCount + 1,
            }
            : conv
        )
      );

      if (activeConversation?.roomId === roomId) {
        setActiveConversation((prev) => {
          

          const updated = prev
            ? {
              ...prev,
              messages: [...prev.messages, msg].sort((a, b) => {
                const aTime = timestampToMillis(a.createAt);
                const bTime = timestampToMillis(b.createAt);
                return aTime - bTime;
              }),
              lastMessage: msg.content,
              lastMessageTime: timestampToMillis(msg.createAt).toString(),
            }
            : null;
          

          return updated;
        });
      }

      const uiMessage = mapChatMessageDTOToUI(msg, currentUserId);
      addUIChatMessage(uiMessage);
    },
    [activeConversation, isOpen, timestampToMillis, addUIChatMessage]
  );

  const initChat = useCallback(
    async (userId: string) => {
      try {
        const room = await roomService.getCustomerHasRoomSupported(userId);

        if (!room) {
          setConversations([]);
          setActiveConversation(null);
          setUiMessages([]);
          return;
        }

        const chatPage = await chatService.getMessages(room.roomId, 20);
        const conversation = buildConversation(room, chatPage.messages);

        setConversations([conversation]);
        setActiveConversation(conversation);

        const uiMessages = mapChatMessageDTOArrayToUI(
          chatPage.messages,
          userId
        );
        setUIChatMessages(uiMessages);

        connectWebSocket(userId, room.roomId);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setConversations([]);
        setActiveConversation(null);
        setUiMessages([]);
      }
    },
    [buildConversation, setUIChatMessages]
  );

  const openChat = useCallback(
    async (userId: string, roomId: string) => {
      try {
        const rooms = await roomService.getAllRoomsByUserId(userId);
        const room = rooms.find((r) => r.roomId === roomId);

        if (!room) {
          console.warn(`Room ${roomId} not found for user ${userId}`);
          setActiveConversation(null);
          setUiMessages([]);
          return;
        }

        const chatPage = await chatService.getMessages(room.roomId, 20);
        const conversation = buildConversation(room, chatPage.messages);

        setConversations([conversation]);
        setActiveConversation(conversation);

        const uiMessages = mapChatMessageDTOArrayToUI(
          chatPage.messages,
          userId
        );
        setUIChatMessages(uiMessages);

        connectWebSocket(userId, roomId);
      } catch (error) {
        console.error("Failed to open chat:", error);
        setActiveConversation(null);
        setUiMessages([]);
      }
    },
    [buildConversation, setUIChatMessages]
  );

  const loadMoreMessages = useCallback(
    async (roomId: string) => {
      if (!activeConversation || activeConversation.roomId !== roomId) return;

      try {
        const lastMessageId =
          activeConversation.messages.length > 0
            ? activeConversation.messages[0].id
            : undefined;

        const chatPage = await chatService.getMessages(
          roomId,
          20,
          lastMessageId
        );

        if (chatPage.messages.length > 0) {
          const sortedNewMessages = chatPage.messages.sort((a, b) => {
            const aTime = timestampToMillis(a.createAt);
            const bTime = timestampToMillis(b.createAt);
            return aTime - bTime;
          });

          const updatedMessages = [
            ...sortedNewMessages,
            ...activeConversation.messages,
          ];
          setChatMessages(updatedMessages);

          const currentUserId = sessionStorage.getItem("userId") || "";
          const newUIMessages = mapChatMessageDTOArrayToUI(
            sortedNewMessages,
            currentUserId
          );
          setUiMessages((prev) => {
            const combined = [...newUIMessages, ...prev];
            const unique = combined.filter(
              (msg, index, arr) =>
                arr.findIndex((m) => m.id === msg.id) === index
            );
            return unique.sort(
              (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
            );
          });
        }
      } catch (error) {
        console.error("Failed to load more messages:", error);
      }
    },
    [activeConversation, timestampToMillis]
  );

  // ✅ FIX: Improved WebSocket connection logic
  const connectWebSocket = useCallback(
    (userId: string, roomId: string) => {
      // If switching rooms, unsubscribe from old room
      if (currentRoomIdRef.current && currentRoomIdRef.current !== roomId) {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      }

      // If already connected to the same room with active subscription, skip
      if (
        stompClientRef.current?.connected &&
        currentRoomIdRef.current === roomId &&
        subscriptionRef.current
      ) {
        return;
      }

      // If client exists and connected, just subscribe to new room
      if (stompClientRef.current?.connected) {
        subscriptionRef.current = stompClientRef.current.subscribe(
          `/topic/room/${roomId}`,
          (message: IMessage) => {
            try {
              const msg: ChatMessageDTO = JSON.parse(message.body);
              
              // ✅ FIX: Generate ID if missing
              if (!msg.id) {
                msg.id = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                console.warn("⚠️ Message missing ID, generated:", msg.id);
              }
              
              if (!msg.createAt) {
                msg.createAt = {
                  seconds: Math.floor(Date.now() / 1000),
                  nanos: (Date.now() % 1000) * 1000000,
                };
              }
              handleNewMessage(msg, roomId);
            } catch (error) {
              console.error("Error parsing WebSocket message:", error);
            }
          }
        );
        
        currentRoomIdRef.current = roomId;
        setConnectionStatus("connected");
        return;
      }

      // Create new WebSocket connection with SockJS
      setConnectionStatus("connecting");

      const sockJsUrl = `${API_BASE_URL}/chat-browser`;
      const stompClient = new Client({
        webSocketFactory: () => {
          return new SockJS(sockJsUrl);
        },
        reconnectDelay: 5000, // Auto-reconnect every 5 seconds - unlimited retries
        heartbeatIncoming: 4000, // Send heartbeat every 4 seconds
        heartbeatOutgoing: 4000, // Expect heartbeat every 4 seconds
        // debug: (str) => ,
      });

      stompClient.onConnect = (frame) => {
        setConnectionStatus("connected");
// ...
        
        subscriptionRef.current = stompClient.subscribe(
          `/topic/room/${roomId}`,
          (message: IMessage) => {
            try {
              const msg: ChatMessageDTO = JSON.parse(message.body);
              
              // ✅ FIX: Generate ID if missing
              if (!msg.id) {
                msg.id = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                console.warn("⚠️ Message missing ID, generated:", msg.id);
              }
              
              if (!msg.createAt) {
                msg.createAt = {
                  seconds: Math.floor(Date.now() / 1000),
                  nanos: (Date.now() % 1000) * 1000000,
                };
              }
              handleNewMessage(msg, roomId);
            } catch (error) {
              console.error("Error parsing WebSocket message:", error);
            }
          }
        );
        
        currentRoomIdRef.current = roomId;
      };

      stompClient.onWebSocketError = (error) => {
        console.error("WebSocket connection error:", error);
        setConnectionStatus("error");
      };

      stompClient.onStompError = (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        setConnectionStatus("error");
      };

      stompClient.activate();
      stompClientRef.current = stompClient;
    },
    [handleNewMessage]
  );

  // ✅ FIX: Improved disconnect logic
  const disconnectWebSocket = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
      } catch (error) {
        console.error("Error disconnecting WebSocket:", error);
      } finally {
        stompClientRef.current = null;
        currentRoomIdRef.current = null;
        setConnectionStatus("disconnected");
      }
    }
  }, []);

  const setChatMessages = useCallback(
    (messages: ChatMessageDTO[]) => {
      if (!activeConversation) return;

      const sortedMessages = messages.sort((a, b) => {
        const aTime = timestampToMillis(a.createAt);
        const bTime = timestampToMillis(b.createAt);
        return aTime - bTime;
      });

      const lastMessage =
        sortedMessages.length > 0
          ? sortedMessages[sortedMessages.length - 1]
          : null;

      const updatedConversation = {
        ...activeConversation,
        messages: sortedMessages,
        lastMessage: lastMessage?.content || "",
        lastMessageTime: lastMessage
          ? timestampToMillis(lastMessage.createAt).toString()
          : "",
      };

      setActiveConversation(updatedConversation);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.roomId === activeConversation.roomId ? updatedConversation : conv
        )
      );
    },
    [activeConversation, timestampToMillis]
  );

  const sendMessage = useCallback(
    (request: MessageRequest) => {
      const roomId = request.roomId;

      if (stompClientRef.current && stompClientRef.current.connected) {
        try {
          stompClientRef.current.publish({
            destination: `/app/chat.sendMessage/${roomId}`,
            body: JSON.stringify(request),
            headers: {},
          });
        } catch (error) {
          console.error("Failed to send message via WebSocket:", error);
        }
      } else {
        console.warn("WebSocket not connected, cannot send message");
        return;
      }

      const now = Date.now();
      const newMsg: ChatMessageDTO = {
        id: `temp-${now}`,
        senderId: request.senderId,
        content: request.message,
        createAt: {
          seconds: Math.floor(now / 1000),
          nanos: (now % 1000) * 1000000,
        },
        type: request.type || "TEXT",
      };

      handleNewMessage(newMsg, roomId);
    },
    [handleNewMessage]
  );

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.roomId === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);

  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);
  const minimizeChat = useCallback(() => setIsMinimized(true), []);
  const maximizeChat = useCallback(() => setIsMinimized(false), []);

  const unreadCount = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  React.useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  const value: ChatContextType = {
    conversations,
    activeConversation,
    unreadCount,
    isOpen,
    isMinimized,
    connectionStatus,
    uiMessages,
    setActiveConversation,
    setChatMessages,
    setUIChatMessages,
    addUIChatMessage,
    sendMessage,
    markAsRead,
    toggleChat,
    minimizeChat,
    maximizeChat,
    connectWebSocket,
    disconnectWebSocket,
    initChat,
    openChat,
    loadMoreMessages,
    supportRooms,
    loadingRooms,
    fetchSupportRooms,
    joinRoom,
    setActiveRoom: setActiveRoom,
    activeRoom,
    loadMessagesForRoom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;