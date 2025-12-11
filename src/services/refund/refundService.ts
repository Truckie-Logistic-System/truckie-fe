import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';

export interface ProcessRefundRequest {
    issueId: string;
    orderDetailId: string;
    refundAmount: number;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    transactionCode: string;
    notes?: string;
    bankTransferImage?: File;
}

export interface Refund {
    id: string;
    refundAmount: number;
    bankTransferImage: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    transactionCode: string;
    refundDate: string;
    notes?: string;
    issueId: string;
    orderDetailId: string;
    processedByStaff: {
        id: string;
        fullName: string;
        email: string;
    };
    createdAt: string;
}

// Staff refund response types
export interface StaffRefundResponse {
    id: string;
    refundAmount: number;
    bankTransferImage?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    transactionCode?: string;
    refundDate?: string;
    notes?: string;
    sourceType?: string;
    createdAt: string;
    processedByStaff?: {
        id: string;
        fullName: string;
        email: string;
        phone?: string;
    };
    issue?: {
        id: string;
        issueTypeName?: string;
        issueCategory?: string;
        description?: string;
        status?: string;
        reportedAt?: string;
        resolvedAt?: string;
        damageFinalCompensation?: number;
        damageCompensationStatus?: string;
    };
    order?: {
        id: string;
        orderCode?: string;
        status?: string;
        senderName?: string;
        receiverName?: string;
    };
    vehicleAssignment?: {
        id: string;
        trackingCode?: string;
        status?: string;
        vehiclePlateNumber?: string;
        driverName?: string;
    };
    transaction?: {
        id: string;
        transactionType?: string;
        amount?: number;
        status?: string;
        paymentProvider?: string;
        gatewayOrderCode?: string;
        paymentDate?: string;
    };
}

interface RefundResponse {
    errorCode: number;
    message: string;
    data: Refund;
}

const refundService = {
    /**
     * Process refund for damaged goods
     * @param request Refund request data
     * @returns Promise with refund data
     */
    processRefund: async (request: ProcessRefundRequest): Promise<Refund> => {
        try {
            const formData = new FormData();
            
            // Add form fields
            formData.append('issueId', request.issueId);
            formData.append('refundAmount', request.refundAmount.toString());
            formData.append('bankName', request.bankName);
            formData.append('accountNumber', request.accountNumber);
            formData.append('accountHolderName', request.accountHolderName);
            formData.append('transactionCode', request.transactionCode);
            
            if (request.notes) {
                formData.append('notes', request.notes);
            }
            
            // Add image file if provided
            if (request.bankTransferImage) {
                formData.append('bankTransferImage', request.bankTransferImage, request.bankTransferImage.name);
            }
            formData.forEach((value, key) => {
                if (value instanceof File) {
                    
                } else {
                }
            });
            
            // Remove default JSON content-type header to allow axios to set multipart/form-data
            const response = await httpClient.post<RefundResponse>('/refunds/process', formData, {
                headers: {
                    'Content-Type': undefined,
                },
            });
            
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Error processing refund:', error);
            throw new Error(error.response?.data?.message || 'Không thể xử lý hoàn tiền');
        }
    },

    /**
     * Get refund by issue ID
     * @param issueId Issue ID
     * @returns Promise with refund data
     */
    getRefundByIssueId: async (issueId: string): Promise<Refund | null> => {
        try {
            const response = await httpClient.get<RefundResponse>(`/refunds/issue/${issueId}`);
            return response.data.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error(`Error fetching refund for issue ${issueId}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin hoàn tiền');
        }
    },

    /**
     * Get refund by order detail ID
     * @param orderDetailId Order detail ID
     * @returns Promise with refund data
     */
    getRefundByOrderDetailId: async (orderDetailId: string): Promise<Refund | null> => {
        try {
            const response = await httpClient.get<RefundResponse>(`/refunds/order-detail/${orderDetailId}`);
            return response.data.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error(`Error fetching refund for order detail ${orderDetailId}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin hoàn tiền');
        }
    },

    /**
     * Get all refunds for staff management
     * @returns Promise with list of refunds sorted by newest first
     */
    getAllRefundsForStaff: async (): Promise<StaffRefundResponse[]> => {
        try {
            const response = await httpClient.get('/refunds/staff/list');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching refunds for staff:', error);
            throw handleApiError(error, 'Không thể tải danh sách hoàn tiền');
        }
    },

    /**
     * Get refund detail for staff with full information
     * @param refundId Refund ID
     * @returns Promise with refund details including issue, order, vehicle assignment, and transaction
     */
    getRefundDetailForStaff: async (refundId: string): Promise<StaffRefundResponse> => {
        try {
            const response = await httpClient.get(`/refunds/staff/${refundId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching refund detail:', error);
            throw handleApiError(error, 'Không thể tải chi tiết hoàn tiền');
        }
    },
};

export default refundService;
