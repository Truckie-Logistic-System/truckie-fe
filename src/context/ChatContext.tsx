import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { Client, Stomp } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";

import type {
  ChatMessageDTO,
  MessageRequest,
  FirestoreTimestamp,
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
  isStaff = false,
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
  const [supportRooms, setSupportRooms] = useState<SupportRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [activeRoom, setActiveRoom] = useState<SupportRoom | null>(null);
  const { user } = useAuth();
  // UI Messages Management
  const setUIChatMessages = useCallback((messages: ChatMessage[]) => {
    const sortedMessages = messages.sort((a, b) => {
      const aTime = parseInt(a.timestamp);
      const bTime = parseInt(b.timestamp);
      return aTime - bTime; // Sort ascending (oldest first)
    });
    setUiMessages(sortedMessages);
  }, []);
  const loadMessagesForRoom = useCallback(
    async (roomId: string) => {
      if (!user) return;
      try {
        const chatPage = await chatService.getMessages(roomId, 20);
        const uiMessages = mapChatMessageDTOArrayToUI(
          chatPage.messages,
          user.id
        );
        setUIChatMessages(uiMessages);
      } catch (error) {
        console.error("Failed to load messages for room:", error);
      }
    },
    [user, setUIChatMessages]
  );
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


  // Trong ChatContext.tsx - hàm joinRoom
  const joinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const success = await roomService.joinRoom(roomId, user.id);
      if (success) {
        // Cập nhật trạng thái room sau khi join thành công
        setSupportRooms((prev) =>
          prev.map((room) =>
            room.roomId === roomId
              ? { ...room, type: "SUPPORTED" as const }
              : room
          )
        );

        // Kết nối WebSocket và mở chat
        connectWebSocket(user.id, roomId);
        setIsOpen(true);
        setIsMinimized(false);

        // Load messages cho room này
        try {
          const chatPage = await chatService.getMessages(roomId, 20);
          const uiMessages = mapChatMessageDTOArrayToUI(
            chatPage.messages,
            user.id
          );
          setUIChatMessages(uiMessages);
        } catch (error) {
          console.error("Failed to load messages:", error);
        }
      }
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  // Helper: convert FirestoreTimestamp to milliseconds
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

  // Helper: build ChatConversation from CreateRoomResponse + messages
  const buildConversation = useCallback(
    (
      room: CreateRoomResponse,
      messages: ChatMessageDTO[]
    ): ChatConversation => {
      const sortedMessages = messages.sort((a, b) => {
        const aTime = timestampToMillis(a.createAt);
        const bTime = timestampToMillis(b.createAt);
        return aTime - bTime; // Sort ascending (oldest first)
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
      // Check if message already exists (avoid duplicates)
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) return prev;

      // Add and sort
      const updated = [...prev, message];
      return updated.sort((a, b) => {
        const aTime = parseInt(a.timestamp);
        const bTime = parseInt(b.timestamp);
        return aTime - bTime;
      });
    });
  }, []);

  // Handle new message from WebSocket
  const handleNewMessage = useCallback(
    (msg: ChatMessageDTO, roomId: string) => {
      const currentUserId = sessionStorage.getItem("userId") || "";

      // Update internal conversation state
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

      // Update active conversation if it's the same room
      if (activeConversation?.roomId === roomId) {
        setActiveConversation((prev) =>
          prev
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
            : null
        );
      }

      // Convert to UI format and add to UI messages
      const uiMessage = mapChatMessageDTOToUI(msg, currentUserId);
      addUIChatMessage(uiMessage);
    },
    [activeConversation, isOpen, timestampToMillis, addUIChatMessage]
  );

  // Initialize chat for user
  const initChat = useCallback(
    async (userId: string) => {
      try {
        const rooms = await roomService.getAllRoomsByUserId(userId);

        if (!rooms || rooms.length === 0) {
          setConversations([]);
          setActiveConversation(null);
          setUiMessages([]);
          return;
        }

        // Get messages for the first room
        const room = rooms[0];
        const chatPage = await chatService.getMessages(room.roomId, 20);
        const conversation = buildConversation(room, chatPage.messages);

        setConversations([conversation]);
        setActiveConversation(conversation);

        // Convert to UI format and set UI messages
        const uiMessages = mapChatMessageDTOArrayToUI(
          chatPage.messages,
          userId
        );
        setUIChatMessages(uiMessages);

        // Connect WebSocket
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

  // Open specific chat room
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

        // Convert to UI format and set UI messages
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

  // Load more messages for pagination
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

          // Update UI messages
          const currentUserId = sessionStorage.getItem("userId") || "";
          const newUIMessages = mapChatMessageDTOArrayToUI(
            sortedNewMessages,
            currentUserId
          );
          setUiMessages((prev) => {
            const combined = [...newUIMessages, ...prev];
            // Remove duplicates and sort
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

  // WebSocket connection logic
  const connectWebSocket = useCallback(
    (userId: string, roomId: string) => {
      // Ngắt kết nối cũ nếu có
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }

      setConnectionStatus("connecting");

      const stompClient = new Client({
        brokerURL: `ws://localhost:8080/chat`,
        reconnectDelay: 5000,
      });

      stompClient.onConnect = (frame) => {
        console.log(`Connected to WebSocket for room: ${roomId}`);
        setConnectionStatus("connected");
        stompClient.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
          try {
            const msg: ChatMessageDTO = JSON.parse(message.body);
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
        });
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

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
        console.log("WebSocket disconnected");
      } catch (error) {
        console.error("Error disconnecting WebSocket:", error);
      } finally {
        stompClientRef.current = null;
        setConnectionStatus("disconnected");
      }
    }
  }, []);

  // Update chat messages for active conversation
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

  // Send new message
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
          console.log("Message sent via WebSocket");
        } catch (error) {
          console.error("Failed to send message via WebSocket:", error);
        }
      } else {
        console.warn("WebSocket not connected, cannot send message");
        return;
      }

      // Optimistic UI update
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

  // Mark conversation as read
  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.roomId === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);

  // UI control functions
  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);
  const minimizeChat = useCallback(() => setIsMinimized(true), []);
  const maximizeChat = useCallback(() => setIsMinimized(false), []);

  // Calculate total unread count
  const unreadCount = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  // Cleanup on unmount
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
