import httpClient from '../api/httpClient';

export interface IssueType {
  id: string;
  issueTypeName: string;
  description?: string;
  issueCategory: string;
  isActive: boolean;
  createdAt?: string;
  modifiedAt?: string;
}

export interface CreateIssueTypeRequest {
  issueTypeName: string;
  description?: string;
  issueCategory: string;
  isActive?: boolean;
}

export interface UpdateIssueTypeRequest {
  id: string;
  issueTypeName: string;
  description?: string;
  issueCategory: string;
  isActive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T;
}

const issueTypeService = {
  /**
   * Get all issue types
   */
  getAllIssueTypes: async (): Promise<IssueType[]> => {
    try {
      const response = await httpClient.get<ApiResponse<IssueType[]>>('/issue-types');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching issue types:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách loại sự cố');
    }
  },

  /**
   * Get issue type by ID
   */
  getIssueTypeById: async (id: string): Promise<IssueType> => {
    try {
      const response = await httpClient.get<ApiResponse<IssueType>>(`/issue-types/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching issue type:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin loại sự cố');
    }
  },

  /**
   * Search issue types by name
   */
  searchIssueTypesByName: async (name: string): Promise<IssueType[]> => {
    try {
      const response = await httpClient.get<ApiResponse<IssueType[]>>('/issue-types/search', {
        params: { name }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error searching issue types:', error);
      throw new Error(error.response?.data?.message || 'Không thể tìm kiếm loại sự cố');
    }
  },

  /**
   * Create a new issue type
   */
  createIssueType: async (request: CreateIssueTypeRequest): Promise<IssueType> => {
    try {
      const response = await httpClient.post<ApiResponse<IssueType>>('/issue-types', request);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating issue type:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo loại sự cố');
    }
  },

  /**
   * Update an existing issue type
   */
  updateIssueType: async (request: UpdateIssueTypeRequest): Promise<IssueType> => {
    try {
      const response = await httpClient.put<ApiResponse<IssueType>>('/issue-types', request);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating issue type:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật loại sự cố');
    }
  },
};

export default issueTypeService;
