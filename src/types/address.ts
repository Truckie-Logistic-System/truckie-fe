export interface Address {
  id: string;
  province: string;
  ward: string;
  street: string;
  addressType: boolean;
  latitude: number;
  longitude: number;
  customerId: string;
}

export interface FormAddress {
  street: string;
  ward: string;
  province: string;
  addressType: boolean;
  customerId: string;
}
