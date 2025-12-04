import React, { useEffect } from 'react';
import router from './routes';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './context';
import { APP_NAME } from './config';
import { RouterProvider } from 'react-router-dom';
import MessageProvider from './components/common/MessageProvider';
import GlobalWebSocketProvider from './components/websocket/GlobalWebSocketProvider';

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
          <GlobalWebSocketProvider>
            <AppContentWrapper />
          </GlobalWebSocketProvider>
        </AuthProvider>
      </MessageProvider>
    </ConfigProvider>
  );
}

// Component wrapper to handle auth loading state
const AppContentWrapper: React.FC = () => {
  const { isLoading } = useAuth();

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

  return <RouterProvider router={router} />;
};

export default App;
