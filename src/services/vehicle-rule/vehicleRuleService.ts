import httpClient from '../api/httpClient';
import type { VehicleRule, VehicleRuleRequest, UpdateVehicleRuleRequest, VehicleRuleCategory, VehicleRuleType, BasingPrice, DistanceRule } from '../../models';
import type { GetVehicleRulesResponse, GetVehicleRuleResponse, CreateVehicleRuleResponse, UpdateVehicleRuleResponse } from './types';

const getVehicleRules = async (): Promise<VehicleRule[]> => {
    const response = await httpClient.get('/vehicle-type-rules');
    return response.data.data;
};

const getVehicleRulesFull = async (): Promise<VehicleRule[]> => {
    const response = await httpClient.get('/vehicle-type-rules/full');
    return response.data.data;
};

const getVehicleRule = async (id: string): Promise<VehicleRule> => {
    const response = await httpClient.get(`/vehicle-type-rules/${id}`);
    return response.data.data;
};

const createVehicleRule = async (vehicleRule: VehicleRuleRequest): Promise<VehicleRule> => {
    const response = await httpClient.post('/vehicle-type-rules', vehicleRule);
    return response.data.data;
};

const updateVehicleRule = async (vehicleRule: UpdateVehicleRuleRequest): Promise<VehicleRule> => {
    const response = await httpClient.put(`/vehicle-type-rules/${vehicleRule.id}`, vehicleRule);
    return response.data.data;
};

const deleteVehicleRule = async (id: string): Promise<void> => {
    await httpClient.delete(`/vehicle-type-rules/${id}`);
};

// Lấy danh sách khoảng cách
const getDistanceRules = async (): Promise<DistanceRule[]> => {
    const response = await httpClient.get('/distance-rules');
    return response.data.data;
};

// Tạo giá cơ bản mới
const createBasingPrice = async (basingPrice: { basePrice: number, vehicleRuleId: string, distanceRuleId: string }): Promise<BasingPrice> => {
    const response = await httpClient.post('/basing-prices', basingPrice);
    return response.data.data;
};

// Cập nhật giá cơ bản
const updateBasingPrice = async (id: string, basingPrice: { basePrice: number, vehicleRuleId: string, distanceRuleId: string }): Promise<BasingPrice> => {
    const response = await httpClient.put(`/basing-prices/${id}`, basingPrice);
    return response.data.data;
};

// Xóa giá cơ bản
const deleteBasingPrice = async (id: string): Promise<void> => {
    await httpClient.delete(`/basing-prices/${id}`);
};

// Lấy danh sách loại hàng
const getCategories = async (): Promise<VehicleRuleCategory[]> => {
    const response = await httpClient.get('/vehicle-rule-categories');
    return response.data.data || [];
};

// Lấy danh sách loại xe
const getVehicleTypes = async (): Promise<VehicleRuleType[]> => {
    const response = await httpClient.get('/vehicle-rule-types');
    return response.data.data || [];
};

const vehicleRuleService = {
    getVehicleRules,
    getVehicleRulesFull,
    getVehicleRule,
    createVehicleRule,
    updateVehicleRule,
    deleteVehicleRule,
    getDistanceRules,
    createBasingPrice,
    updateBasingPrice,
    deleteBasingPrice,
    getCategories,
    getVehicleTypes
};

export default vehicleRuleService; 