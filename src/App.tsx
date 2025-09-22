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
          <AppContent />
        </AuthProvider>
      </MessageProvider>
    </ConfigProvider>
  );
}

// Component để chọn đúng ChatWidget dựa trên vai trò và wrap với ChatProvider
const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Determine if this is a staff user for the ChatProvider
  const isStaff = user?.role === 'staff';

  return (
    <ChatProvider isStaff={isStaff}>
      <RouterProvider router={router} />
      {isStaff ? <StaffChatWidget /> : <ChatWidget />}
    </ChatProvider>
  );
};

export default App;
