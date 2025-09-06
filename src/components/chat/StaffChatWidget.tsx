import React from 'react';
import { ChatProvider, useChatContext } from '@/context/ChatContext';
import StaffChatButton from './StaffChatButton';
import StaffChatWindow from './StaffChatWindow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Component nội bộ để tránh lỗi context
const StaffChatWidgetContent: React.FC = () => {
    const { isOpen, toggleChat } = useChatContext();

    return (
        <>
            {isOpen ? <StaffChatWindow /> : <StaffChatButton onClick={toggleChat} />}
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

const StaffChatWidget: React.FC = () => {
    return (
        <ChatProvider isStaff={true}>
            <StaffChatWidgetContent />
        </ChatProvider>
    );
};

export default StaffChatWidget; 