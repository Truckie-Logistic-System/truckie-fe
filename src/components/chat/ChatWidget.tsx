import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ChatWidgetProps {
    onOpen?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onOpen }) => {
    const { isOpen } = useChatContext();

    return (
        <>
            {/* Button always visible */}
            <ChatButton onOpen={onOpen} />
            {/* Window only when open */}
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

export default ChatWidget;