export interface CarrierSettingsResponse {
  id: string;
  carrierAddressLine: string;
  carrierEmail: string;
  carrierPhone: string;
  carrierTaxCode: string;
  carrierLatitude: number;
  carrierLongitude: number;
}

export interface CarrierSettingsRequest {
  carrierAddressLine: string;
  carrierEmail: string;
  carrierPhone: string;
  carrierTaxCode: string;
  carrierLatitude: number;
  carrierLongitude: number;
}
