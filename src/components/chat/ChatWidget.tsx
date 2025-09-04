import React from 'react';
import { ChatProvider } from '@/context/ChatContext';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useChatContext } from '@/context/ChatContext';

// Component nội bộ để tránh lỗi context
const ChatWidgetContent: React.FC = () => {
    const { isOpen } = useChatContext();

    return (
        <>
            <ChatButton />
            {isOpen && <ChatWindow />}
            <ToastContainer
                position="bottom-left"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </>
    );
};

const ChatWidget: React.FC = () => {
    return (
        <ChatProvider>
            <ChatWidgetContent />
        </ChatProvider>
    );
};

export default ChatWidget; 