import type { Order, OrderDetail, OrderCreateRequest as OrderCreateRequestModel } from '@/models/Order';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export interface OrderUpdateDto {
    status?: string;
    notes?: string;
}

export interface OrderTrackingResponse {
    orderId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
}

export interface UnitsListResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: string[];
}

export interface CustomerOrder {
    id: string;
    orderCode: string;
    totalPrice: number | null;
    totalQuantity: number;
    status: string;
    notes: string;
    packageDescription: string;
    receiverName: string;
    receiverPhone: string;
    pickupAddress: string;
    deliveryAddress: string;
    deliveryAddressId: string;
    createdAt: string;
}

export interface CustomerOrdersResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: CustomerOrder[];
}

export interface CustomerOrderDetailResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: {
        order: CustomerOrderDetail;
        contract?: CustomerContract;
        transactions?: CustomerTransaction[];
    };
}

export interface CustomerOrderDetail {
    id: string;
    totalPrice: number;
    notes: string;
    totalQuantity: number;
    orderCode: string;
    receiverName: string;
    receiverPhone: string;
    receiverIdentity?: string;
    packageDescription: string;
    createdAt: string;
    status: string;
    deliveryAddress: string;
    pickupAddress: string;
    senderName: string;
    senderPhone: string;
    senderCompanyName: string;
    categoryName: string;
    orderDetails: CustomerOrderDetailItem[];
}

export interface CustomerOrderDetailItem {
    id: string;
    weightBaseUnit: number;
    unit: string;
    description: string;
    status: string;
    startTime: string;
    estimatedStartTime: string;
    endTime: string;
    estimatedEndTime: string;
    createdAt: string;
    trackingCode: string;
    orderSize?: {
        id: string;
        description: string;
        minLength: number;
        maxLength: number;
        minHeight: number;
        maxHeight: number;
        minWidth: number;
        maxWidth: number;
    };
    vehicleAssignment?: {
        id: string;
        vehicleName: string;
        licensePlateNumber: string;
        primaryDriver?: {
            id: string;
            fullName: string;
            phoneNumber: string;
        };
        secondaryDriver?: {
            id: string;
            fullName: string;
            phoneNumber: string;
        };
        status: string;
        issue?: {
            issue: {
                id: string;
                description: string;
                locationLatitude: number;
                locationLongitude: number;
                status: string;
                vehicleAssignmentId: string;
                staff: {
                    id: string;
                    name: string;
                    phone: string;
                };
                issueTypeName: string;
            };
            imageUrls: string[];
        };
        photoCompletions?: string[];
        orderSeals?: {
            id: string;
            description: string;
            sealDate: string;
            status: string;
            sealId: string;
        }[];
        journeyHistory?: {
            id: string;
            startLocation: number;
            endLocation: number;
            startTime: string;
            endTime: string;
            status: string;
            totalDistance: number;
            isReportedIncident: boolean;
            createdAt: string;
            modifiedAt: string;
        }[];
    };
}

export interface CustomerContract {
    id: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    totalValue: string;
    supportedValue: string;
    description: string;
    attachFileUrl: string;
    status: string;
    staffName: string;
}

export interface CustomerTransaction {
    id: string;
    paymentProvider: string;
    orderCode: string;
    amount: number;
    currencyCode: string;
    status: string;
    paymentDate: string;
}

export type OrderResponse = ApiResponse<Order>;
export type OrdersResponse = ApiResponse<Order[]>;
export type OrderDetailsResponse = ApiResponse<OrderDetail[]>;
export type PaginatedOrdersResponse = ApiResponse<PaginatedResponse<Order>>;
export type OrderTrackingApiResponse = ApiResponse<OrderTrackingResponse>;
export type VehicleAssignmentResponse = ApiResponse<OrderDetail[]>;

export interface RecentReceiverSuggestion {
    orderId: string;
    receiverName: string;
    receiverPhone: string;
    receiverIdentity: string;
    partialAddress: string;
    orderDate: string;
}

export interface RecentReceiversResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: RecentReceiverSuggestion[];
}

export interface ReceiverDetailsResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: {
        receiverName: string;
        receiverPhone: string;
        receiverIdentity: string;
        pickupAddressId: string;
        deliveryAddressId: string;
        pickupAddress: {
            id: string;
            province: string;
            ward: string;
            street: string;
            addressType: boolean;
            latitude: number;
            longitude: number;
            customerId: string;
        };
        deliveryAddress: {
            id: string;
            province: string;
            ward: string;
            street: string;
            addressType: boolean;
            latitude: number;
            longitude: number;
            customerId: string;
        };
    };
}

export interface StaffOrderDetailResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: {
        order: StaffOrderDetail;
        contract?: CustomerContract;
        transactions?: CustomerTransaction[];
    };
}

export interface StaffOrderDetail {
    id: string;
    totalPrice: number;
    notes: string;
    totalQuantity: number;
    orderCode: string;
    receiverName: string;
    receiverPhone: string;
    receiverIdentity: string;
    packageDescription: string;
    createdAt: string;
    status: string;
    deliveryAddress: string;
    pickupAddress: string;
    senderRepresentativeName: string;
    senderRepresentativePhone: string;
    senderCompanyName: string;
    categoryName: string;
    orderDetails: StaffOrderDetailItem[];
}

export interface StaffOrderDetailItem {
    id: string;
    weightBaseUnit: number;
    unit: string;
    description: string;
    status: string;
    startTime: string;
    estimatedStartTime: string;
    endTime: string;
    estimatedEndTime: string;
    createdAt: string;
    trackingCode: string;
    orderSize?: {
        id: string;
        description: string;
        minLength: number;
        maxLength: number;
        minHeight: number;
        maxHeight: number;
        minWidth: number;
        maxWidth: number;
    };
    vehicleAssignment?: {
        id: string;
        vehicle: {
            id: string;
            manufacturer: string;
            model: string;
            licensePlateNumber: string;
            vehicleType: string;
        };
        primaryDriver?: {
            id: string;
            fullName: string;
            phoneNumber: string;
            email: string;
            imageUrl: string;
            gender: boolean;
            dateOfBirth: string;
            identityNumber: string;
            driverLicenseNumber: string;
            cardSerialNumber: string;
            placeOfIssue: string;
            dateOfIssue: string;
            dateOfExpiry: string;
            licenseClass: string;
            dateOfPassing: string;
            status: string;
            address: string;
            createdAt: string;
        };
        secondaryDriver?: {
            id: string;
            fullName: string;
            phoneNumber: string;
            email: string;
            imageUrl: string;
            gender: boolean;
            dateOfBirth: string;
            identityNumber: string;
            driverLicenseNumber: string;
            cardSerialNumber: string;
            placeOfIssue: string;
            dateOfIssue: string;
            dateOfExpiry: string;
            licenseClass: string;
            dateOfPassing: string;
            status: string;
            address: string;
            createdAt: string;
        };
        status: string;
        penalties?: {
            id: string;
            violationType: string;
            violationDescription: string;
            penaltyAmount: number;
            penaltyDate: string;
            location: string;
            status: string;
            paymentDate: string;
            disputeReason: string;
            driverId: string;
            vehicleAssignmentId: string;
        }[];
        cameraTrackings?: {
            id: string;
            videoUrl: string;
            trackingAt: string;
            status: string;
            vehicleAssignmentId: string;
            deviceName: string;
        }[];
        fuelConsumption?: {
            id: string;
            odometerReadingAtRefuel: number;
            odometerAtStartUrl: string;
            odometerAtFinishUrl: string;
            odometerAtEndUrl: string;
            dateRecorded: string;
            notes: string;
            fuelTypeName: string;
            fuelTypeDescription: string;
        };
        orderSeals?: {
            id: string;
            description: string;
            sealDate: string;
            status: string;
            sealId: string;
        }[];
        journeyHistories?: {
            id: string;
            startLocation: number;
            endLocation: number;
            startTime: string;
            endTime: string;
            status: string;
            totalDistance: number;
            isReportedIncident: boolean;
            createdAt: string;
            modifiedAt: string;
        }[];
        issues?: {
            issue: {
                id: string;
                description: string;
                locationLatitude: number;
                locationLongitude: number;
                status: string;
                vehicleAssignmentId: string;
                staff: {
                    id: string;
                    name: string;
                    phone: string;
                };
                issueTypeName: string;
            };
            imageUrls: string[];
        }[];
    };
} 