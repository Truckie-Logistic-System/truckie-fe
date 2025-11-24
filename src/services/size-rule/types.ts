import type { SizeRule } from '../../models';
import type { ApiResponse } from '../api/types';

export type GetSizeRulesResponse = ApiResponse<SizeRule[]>;
export type GetSizeRuleResponse = ApiResponse<SizeRule>;
export type CreateSizeRuleResponse = ApiResponse<SizeRule>;
export type UpdateSizeRuleResponse = ApiResponse<SizeRule>; 