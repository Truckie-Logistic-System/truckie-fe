import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLogoutListener } from '@/hooks/useLogoutListener';
import { useAuth } from '@/context';
import { IssuesProvider } from '@/context/IssuesContext';
import CustomerChatWidget from '@/components/userChat/CustomerChatWidget';
import StaffUserChatWidget from '@/components/userChat/StaffUserChatWidget';
import { AIChatbot } from '@/components/ai-chatbot';

/**
 * Root layout component that wraps all routes
 * Handles logout listener which requires Router context
 */
const RootLayout: React.FC = () => {
  // Listen for logout events from httpClient
  useLogoutListener();
  
  const { user } = useAuth();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  
  // State to manage which chat is open
  const [isNormalChatOpen, setIsNormalChatOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Handle normal chat open - close AI chat if open
  const handleNormalChatOpen = () => {
    setIsNormalChatOpen(true);
    setIsAIChatOpen(false);
  };

  // Handle normal chat close
  const handleNormalChatClose = () => {
    setIsNormalChatOpen(false);
  };

  // Handle AI chat open - close normal chat if open
  const handleAIChatOpen = () => {
    setIsAIChatOpen(true);
    setIsNormalChatOpen(false);
  };

  // Handle AI chat close
  const handleAIChatClose = () => {
    setIsAIChatOpen(false);
  };

  // WebSocket connections are now handled by GlobalWebSocketProvider at app root

  return (
    <IssuesProvider>
      <Outlet />
      {/* Chat Widgets - Staff or Customer/Guest */}
      {isStaff ? (
        <StaffUserChatWidget />
      ) : (
        <>
          {/* Customer Chat Widget */}
          <CustomerChatWidget 
            isOpen={isNormalChatOpen}
            onClose={handleNormalChatClose}
            onOpen={handleNormalChatOpen}
          />
          {/* AI Chatbot for Customer/Guest */}
          <AIChatbot 
            isOpen={isAIChatOpen}
            onClose={handleAIChatClose}
            onOpen={handleAIChatOpen}
          />
        </>
      )}
    </IssuesProvider>
  );
};

export default RootLayout;
