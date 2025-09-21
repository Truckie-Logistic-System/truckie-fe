import type { ApiResponse } from '../api/types';
import type { Device, DeviceType } from '../../models';

export type GetDevicesResponse = ApiResponse<Device[]>;
export type GetDeviceTypesResponse = ApiResponse<DeviceType[]>; 