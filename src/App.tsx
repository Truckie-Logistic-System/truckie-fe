import React, { useEffect } from 'react';
import AppRoutes from './routes';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context';
import { APP_NAME } from './config';
import ChatWidget from './components/chat/ChatWidget';

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
        <ChatWidget />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
