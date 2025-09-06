import type { OrderDetails, FormOrderDetails } from "./orderDetails";
import type { OrderSize, FormOrderSize } from "./orderSize";
import type { Orders, FormOrders } from "./orders";
import type { Category, FormCategory } from "./category";
import type { Address, FormAddress } from "./address";
// Common interfaces used across the application
export * from "./common";
// User related types
export interface User {
  id: string;
  username: string;
  email: string;
  imageUrl: string | null;
  status: string;
  role: {
    roleName: string;
    isActive: boolean;
  };
}

// Route related types
export interface Route {
  id: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedTime: number;
}

// Component props types
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export interface ButtonProps {
  label: string;
  onClick: () => void;
  type?: "primary" | "secondary" | "danger";
}

export type { Address, FormAddress };
export type { Category, FormCategory };
export type { OrderDetails, FormOrderDetails };
export type { Orders, FormOrders };
export type { OrderSize, FormOrderSize };

// HTTP Status Codes and Error Handling
export {
  HttpStatusCode,
  HttpErrorMessages,
  HttpStatusHelpers,
  AppErrorCode,
  AppErrorMessages,
} from "../utils/httpCodes";
