import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatWidget: React.FC = () => {
    const { isOpen } = useChatContext();

    return (
        <>
            {isOpen ? <ChatWindow /> : <ChatButton />}
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