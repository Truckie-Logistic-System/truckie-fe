import React, { useEffect } from 'react';
import router from './routes';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './context';
import { APP_NAME } from './config';
import ChatWidget from './components/chat/ChatWidget';
import StaffChatWidget from './components/chat/StaffChatWidget';
import { RouterProvider } from 'react-router-dom';
import MessageProvider from './components/common/MessageProvider';
import { ChatProvider } from './context/ChatContext';
import { IssuesProvider } from './context/IssuesContext';
import issueWebSocket from './services/websocket/issueWebSocket';

function App() {
  // Set document title
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff", // Blue color for primary elements
          fontFamily:
            "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <MessageProvider>
        <AuthProvider>
          <AppContentWrapper />
        </AuthProvider>
      </MessageProvider>
    </ConfigProvider>
  );
}

// Component wrapper to handle context providers in correct order
const AppContentWrapper: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Connect to WebSocket for staff users
  useEffect(() => {
    if (user && user.role === 'staff') {
      console.log('🔌 [App] Connecting to issue WebSocket for staff...');
      issueWebSocket.connect().catch(error => {
        console.error('❌ [App] Failed to connect to WebSocket:', error);
      });

      return () => {
        console.log('🔌 [App] Disconnecting from issue WebSocket...');
        issueWebSocket.disconnect();
      };
    }
  }, [user]);

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: "'Be Vietnam Pro', sans-serif"
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  // Determine if this is a staff user
  const isStaff = user?.role === 'staff';

  return (
    <ChatProvider isStaff={isStaff}>
      <IssuesProvider>
        <RouterProvider router={router} />
        {isStaff ? <StaffChatWidget /> : <ChatWidget />}
      </IssuesProvider>
    </ChatProvider>
  );
};

export default App;
