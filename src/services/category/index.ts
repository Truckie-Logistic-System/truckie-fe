export * from './categoryService';
export * from './types';

// Re-export categoryService as default for backward compatibility
import { categoryService } from './categoryService';
export default categoryService; 