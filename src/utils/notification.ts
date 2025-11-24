import { message } from 'antd';
import type { MessageType } from 'antd/es/message/interface';

// Configure global message settings
message.config({
    top: 70,          // Distance from top
    duration: 3,      // Default duration in seconds
    maxCount: 3,      // Max number of messages shown at once
    rtl: false        // Right-to-left direction
});

interface NotificationOptions {
    duration?: number;
}

const defaultOptions: NotificationOptions = {
    duration: 3, // Thời gian hiển thị mặc định là 3 giây
};

/**
 * Hiển thị thông báo thành công dạng toast
 * @param content Nội dung thông báo
 * @param options Tùy chọn thông báo
 * @returns MessageType
 */
export const showSuccess = (content: string, options?: NotificationOptions): MessageType => {
    const mergedOptions = { ...defaultOptions, ...options };
    return message.success(content, mergedOptions.duration);
};

/**
 * Hiển thị thông báo lỗi dạng toast
 * @param content Nội dung thông báo
 * @param options Tùy chọn thông báo
 * @returns MessageType
 */
export const showError = (content: string, options?: NotificationOptions): MessageType => {
    const mergedOptions = { ...defaultOptions, ...options };
    return message.error(content, mergedOptions.duration);
};

/**
 * Hiển thị thông báo cảnh báo dạng toast
 * @param content Nội dung thông báo
 * @param options Tùy chọn thông báo
 * @returns MessageType
 */
export const showWarning = (content: string, options?: NotificationOptions): MessageType => {
    const mergedOptions = { ...defaultOptions, ...options };
    return message.warning(content, mergedOptions.duration);
};

/**
 * Hiển thị thông báo thông tin dạng toast
 * @param content Nội dung thông báo
 * @param options Tùy chọn thông báo
 * @returns MessageType
 */
export const showInfo = (content: string, options?: NotificationOptions): MessageType => {
    const mergedOptions = { ...defaultOptions, ...options };
    return message.info(content, mergedOptions.duration);
};

/**
 * Hiển thị thông báo đang tải dạng toast
 * @param content Nội dung thông báo
 * @param options Tùy chọn thông báo
 * @returns MessageType
 */
export const showLoading = (content: string, options?: NotificationOptions): MessageType => {
    const mergedOptions = { ...defaultOptions, ...options };
    return message.loading(content, mergedOptions.duration);
};

/**
 * Đóng tất cả các thông báo toast
 */
export const closeAll = (): void => {
    message.destroy();
};

const notificationUtils = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    closeAll,
};

export default notificationUtils; 