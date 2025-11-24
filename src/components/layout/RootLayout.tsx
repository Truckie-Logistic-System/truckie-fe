import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLogoutListener } from '@/hooks/useLogoutListener';
import { useAuth } from '@/context';
import { ChatProvider, useChatContext } from '@/context/ChatContext';
import { IssuesProvider } from '@/context/IssuesContext';
import ChatWidget from '@/components/chat/ChatWidget';
import StaffChatWidget from '@/components/chat/StaffChatWidget';
import { AIChatbot } from '@/components/ai-chatbot';
import issueWebSocket from '@/services/websocket/issueWebSocket';

/**
 * Root layout component that wraps all routes
 * Handles logout listener which requires Router context
 */
const RootLayout: React.FC = () => {
  // Listen for logout events from httpClient
  useLogoutListener();
  
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  // Connect to WebSocket for staff users
  useEffect(() => {
    if (user && user.role === 'staff') {
      issueWebSocket.connect().catch(error => {
        console.error('❌ [RootLayout] Failed to connect to WebSocket:', error);
      });

      return () => {
        issueWebSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <ChatProvider isStaff={isStaff}>
      <IssuesProvider>
        <Outlet />
        {/* Chat Widgets with toggle logic */}
        <ChatWidgetsManager isStaff={isStaff} />
      </IssuesProvider>
    </ChatProvider>
  );
};

/**
 * Manages toggle between AI chat and normal chat
 */
const ChatWidgetsManager: React.FC<{ isStaff: boolean }> = ({ isStaff }) => {
  const { isOpen: isChatOpen, toggleChat } = useChatContext();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Close AI chat when normal chat opens
  const handleChatOpen = () => {
    setIsAIChatOpen(false);
  };

  // Close normal chat when AI chat opens  
  const handleAIChatOpen = () => {
    if (isChatOpen) {
      toggleChat();
    }
    setIsAIChatOpen(true);
  };

  return (
    <>
      {isStaff ? <StaffChatWidget /> : <ChatWidget onOpen={handleChatOpen} />}
      {/* AI Chatbot chỉ cho Customer và Guest (không phải Staff) */}
      {!isStaff && <AIChatbot onOpen={handleAIChatOpen} />}
    </>
  );
};

export default RootLayout;
