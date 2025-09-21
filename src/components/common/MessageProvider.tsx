import React, { useEffect } from 'react';
import { message, App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';

// Tạo context để lưu trữ các static functions
let messageApi: MessageInstance;
let notificationApi: NotificationInstance;
let modalApi: Omit<ModalStaticFunctions, 'warn'>;

// Hàm này sẽ được gọi để cấu hình các static functions
export const setMessageInstance = (instance: MessageInstance) => {
    messageApi = instance;
};

export const setNotificationInstance = (instance: NotificationInstance) => {
    notificationApi = instance;
};

export const setModalInstance = (instance: Omit<ModalStaticFunctions, 'warn'>) => {
    modalApi = instance;
};

// Hàm wrapper để sử dụng các static functions
export const showMessage = {
    success: (content: string, duration?: number) => messageApi?.success(content, duration),
    error: (content: string, duration?: number) => messageApi?.error(content, duration),
    warning: (content: string, duration?: number) => messageApi?.warning(content, duration),
    info: (content: string, duration?: number) => messageApi?.info(content, duration),
    loading: (content: string, duration?: number) => messageApi?.loading(content, duration),
};

// Component Provider
const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Cấu hình message global
    useEffect(() => {
        message.config({
            top: 70,
            duration: 3,
            maxCount: 3,
            rtl: false,
        });
    }, []);

    return (
        <App>
            {children}
        </App>
    );
};

export default MessageProvider; 