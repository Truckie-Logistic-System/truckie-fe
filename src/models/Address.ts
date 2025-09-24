export interface Address {
    id: string;
    province: string;
    ward: string;
    street: string;
    addressType: boolean;
    latitude: number;
    longitude: number;
    customerId: string;
    fullAddress?: string; // Thêm để tương thích với code hiện tại
}

export interface AddressCreateDto {
    street: string;
    ward: string;
    province: string;
    addressType: boolean;
    customerId?: string; // Make customerId optional since it will be handled by the backend
}

export interface AddressUpdateDto {
    street?: string;
    ward?: string;
    province?: string;
    addressType?: boolean;
} 