import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import StaffChatButton from './StaffChatButton';
import StaffChatWindow from './StaffChatWindow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StaffChatWidget: React.FC = () => {
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

export default StaffChatWidget; 