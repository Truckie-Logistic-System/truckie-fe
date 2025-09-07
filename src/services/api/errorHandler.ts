import axios, { AxiosError } from 'axios';

interface ApiErrorResponse {
    message?: string;
    success?: boolean;
    statusCode?: number;
    [key: string]: any;
}

/**
 * Xử lý các lỗi API và trả về thông báo lỗi phù hợp
 * @param error Lỗi từ API call
 * @param defaultMessage Thông báo mặc định nếu không xác định được lỗi cụ thể
 * @returns Thông báo lỗi người dùng có thể hiểu được
 */
export const handleApiError = (error: unknown, defaultMessage: string = 'Đã xảy ra lỗi'): Error => {
    // If the error is already an Error instance with a message, return it
    if (error instanceof Error && error.message) {
        return error;
    }

    // Nếu là lỗi Axios
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;

        // Lỗi kết nối mạng
        if (!axiosError.response) {
            return new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        }

        // Kiểm tra nếu API trả về success: false với message
        if (axiosError.response.data && typeof axiosError.response.data === 'object') {
            if (axiosError.response.data.success === false && axiosError.response.data.message) {
                return new Error(axiosError.response.data.message);
            }
            if (axiosError.response.data.message) {
                return new Error(axiosError.response.data.message);
            }
        }

        // Xử lý các mã lỗi HTTP cụ thể
        switch (axiosError.response.status) {
            case 400:
                return new Error(
                    axiosError.response.data?.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.'
                );
            case 401:
                return new Error('Tên đăng nhập hoặc mật khẩu không đúng.');
            case 403:
                return new Error('Bạn không có quyền truy cập tài nguyên này.');
            case 404:
                return new Error('Không tìm thấy dữ liệu yêu cầu.');
            case 409:
                return new Error('Dữ liệu đã tồn tại hoặc xung đột.');
            case 422:
                return new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
            case 429:
                return new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
            case 500:
                return new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
            case 502:
            case 503:
            case 504:
                return new Error('Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.');
            default:
                return new Error(
                    axiosError.response.data?.message ||
                    `Lỗi ${axiosError.response.status}: ${defaultMessage}`
                );
        }
    }

    // Nếu là lỗi thông thường
    if (error instanceof Error) {
        return error;
    }

    // Nếu không xác định được loại lỗi
    return new Error(defaultMessage);
}; 