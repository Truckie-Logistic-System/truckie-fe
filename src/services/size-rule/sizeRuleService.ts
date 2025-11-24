import httpClient from '../api/httpClient';
import type { SizeRule, SizeRuleRequest, UpdateSizeRuleRequest, SizeRuleCategory, SizeRuleType, BasingPrice, DistanceRule } from '../../models';
import type { GetSizeRulesResponse, GetSizeRuleResponse, CreateSizeRuleResponse, UpdateSizeRuleResponse } from './types';

const getSizeRules = async (): Promise<SizeRule[]> => {
    const response = await httpClient.get('/vehicle-type-rules');
    return response.data.data;
};

const getSizeRulesFull = async (): Promise<SizeRule[]> => {
    const response = await httpClient.get('/vehicle-type-rules/full');
    return response.data.data;
};

const getSizeRule = async (id: string): Promise<SizeRule> => {
    const response = await httpClient.get(`/vehicle-type-rules/${id}`);
    return response.data.data;
};

const createSizeRule = async (sizeRule: SizeRuleRequest): Promise<SizeRule> => {
    const response = await httpClient.post('/vehicle-type-rules', sizeRule);
    return response.data.data;
};

const updateSizeRule = async (sizeRule: UpdateSizeRuleRequest): Promise<SizeRule> => {
    const response = await httpClient.put(`/vehicle-type-rules/${sizeRule.id}`, sizeRule);
    return response.data.data;
};

const deleteSizeRule = async (id: string): Promise<void> => {
    await httpClient.delete(`/vehicle-type-rules/${id}`);
};

// Lấy danh sách khoảng cách
const getDistanceRules = async (): Promise<DistanceRule[]> => {
    const response = await httpClient.get('/distance-rules');
    return response.data.data;
};

// Tạo giá cơ bản mới
const createBasingPrice = async (basingPrice: { basePrice: number, sizeRuleId: string, distanceRuleId: string }): Promise<BasingPrice> => {
    const response = await httpClient.post('/basing-prices', basingPrice);
    return response.data.data;
};

// Cập nhật giá cơ bản
const updateBasingPrice = async (id: string, basingPrice: { basePrice: number, sizeRuleId: string, distanceRuleId: string }): Promise<BasingPrice> => {
    const response = await httpClient.put(`/basing-prices/${id}`, basingPrice);
    return response.data.data;
};

// Xóa giá cơ bản
const deleteBasingPrice = async (id: string): Promise<void> => {
    await httpClient.delete(`/basing-prices/${id}`);
};

// Lấy danh sách loại hàng
const getCategories = async (): Promise<SizeRuleCategory[]> => {
    const response = await httpClient.get('/vehicle-rule-categories');
    return response.data.data || [];
};

// Lấy danh sách loại xe
const getVehicleTypes = async (): Promise<SizeRuleType[]> => {
    const response = await httpClient.get('/vehicle-rule-types');
    return response.data.data || [];
};

const sizeRuleService = {
    getSizeRules,
    getSizeRulesFull,
    getSizeRule,
    createSizeRule,
    updateSizeRule,
    deleteSizeRule,
    getDistanceRules,
    createBasingPrice,
    updateBasingPrice,
    deleteBasingPrice,
    getCategories,
    getVehicleTypes
};

export default sizeRuleService;