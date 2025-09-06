import React, { useEffect } from 'react';
import AppRoutes from './routes';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './context';
import { APP_NAME } from './config';
import ChatWidget from './components/chat/ChatWidget';
import StaffChatWidget from './components/chat/StaffChatWidget';

// Component để chọn đúng ChatWidget dựa trên vai trò
const ChatWidgetSelector: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'staff') {
    return <StaffChatWidget />;
  }

  return <ChatWidget />;
};

function App() {
  // Set document title
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff', // Blue color for primary elements
          fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <AuthProvider>
        <AppRoutes />
        <ChatWidgetSelector />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
