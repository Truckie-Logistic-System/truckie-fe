import httpClient from '../api/httpClient';

export interface CompensationAssessment {
  id: string;
  issueType: string;
  hasDocuments: boolean;
  documentValue?: number;
  estimatedMarketValue?: number;
  assessmentRate: number;
  compensationByPolicy: number;
  finalCompensation: number;
  fraudDetected: boolean;
  fraudReason?: string;
  createdAt: string;
  updatedAt?: string;
  issue?: {
    id: string;
    issueTypeName?: string;
    issueCategory?: string;
    status: string;
    description?: string;
    reportedAt?: string;
    resolvedAt?: string;
  };
  createdByStaff?: {
    id: string;
    fullName?: string;
    email?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T;
}

const compensationAssessmentService = {
  /**
   * Get all compensation assessments for staff (sorted by createdAt DESC)
   */
  getAllCompensationAssessments: async (): Promise<CompensationAssessment[]> => {
    try {
      const response = await httpClient.get<ApiResponse<CompensationAssessment[]>>('/compensation/staff/list');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching compensation assessments:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách thẩm định bồi thường');
    }
  },
};

export default compensationAssessmentService;
