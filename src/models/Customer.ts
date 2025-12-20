import type { User, UserResponse } from "./User";

export interface Customer {
  id: string;
  companyName: string;
  representativeName: string;
  representativePhone: string;
  businessLicenseNumber: string;
  businessAddress: string;
  status: string;
  userResponse: UserResponse; // Đổi từ user thành userResponse
}

// CustomerModel để sử dụng trong UI, tương thích với UserModel nhưng lấy status từ Customer
export interface CustomerModel {
  id: string; // user id (để tương thích với code hiện tại)
  customerId: string; // customer id
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: boolean;
  dateOfBirth: string;
  imageUrl: string;
  status: string; // customer status (ACTIVE, INACTIVE, BANNED)
  companyName: string;
  representativeName: string;
  representativePhone: string;
  businessLicenseNumber: string;
  businessAddress: string;
  role: UserResponse["role"];
}

// Helper function để convert Customer sang CustomerModel
export const convertToCustomerModel = (customer: Customer): CustomerModel => {
  return {
    id: customer.userResponse.id, // Dùng userId làm id chính
    customerId: customer.id, // Lưu customerId riêng
    username: customer.userResponse.username,
    fullName: customer.userResponse.fullName,
    email: customer.userResponse.email,
    phoneNumber: customer.userResponse.phoneNumber,
    gender: customer.userResponse.gender,
    dateOfBirth: customer.userResponse.dateOfBirth,
    imageUrl: customer.userResponse.imageUrl || "",
    status: customer.status, // Lấy status từ customer, KHÔNG phải user
    companyName: customer.companyName,
    representativeName: customer.representativeName,
    representativePhone: customer.representativePhone,
    businessLicenseNumber: customer.businessLicenseNumber,
    businessAddress: customer.businessAddress,
    role: customer.userResponse.role,
  };
};

export interface CustomerCreateDto {
  companyName: string;
  representativeName: string;
  representativePhone: string;
  businessLicenseNumber: string;
  businessAddress: string;
}

export interface CustomerUpdateDto {
  companyName?: string;
  representativeName?: string;
  representativePhone?: string;
  businessLicenseNumber?: string;
  businessAddress?: string;
}
