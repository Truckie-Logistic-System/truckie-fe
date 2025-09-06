export interface OrderSize {
  id: string;
  minWeight: number;
  maxWeight: number;
  minLength: number;
  maxLength: number;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  status: string;
  description: string;
}

export interface FormOrderSize {
  minWeight: number;
  maxWeight: number;
  minLength: number;
  maxLength: number;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  description: string;
}
