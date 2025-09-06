// HTTP Status Codes Enums
export enum HttpStatusCode {
  // Success codes
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // Redirection codes
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,

  // Client error codes
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // Server error codes
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Error Messages corresponding to status codes
export const HttpErrorMessages: Record<HttpStatusCode, string> = {
  [HttpStatusCode.OK]: "Success",
  [HttpStatusCode.CREATED]: "Resource created successfully",
  [HttpStatusCode.ACCEPTED]: "Request accepted",
  [HttpStatusCode.NO_CONTENT]: "No content",

  [HttpStatusCode.MOVED_PERMANENTLY]: "Resource moved permanently",
  [HttpStatusCode.FOUND]: "Resource found",
  [HttpStatusCode.NOT_MODIFIED]: "Not modified",

  [HttpStatusCode.BAD_REQUEST]: "Bad request - Invalid input data",
  [HttpStatusCode.UNAUTHORIZED]: "Unauthorized - Please login",
  [HttpStatusCode.FORBIDDEN]: "Forbidden - Access denied",
  [HttpStatusCode.NOT_FOUND]: "Resource not found",
  [HttpStatusCode.METHOD_NOT_ALLOWED]: "Method not allowed",
  [HttpStatusCode.CONFLICT]: "Conflict - Resource already exists",
  [HttpStatusCode.UNPROCESSABLE_ENTITY]: "Validation failed",
  [HttpStatusCode.TOO_MANY_REQUESTS]:
    "Too many requests - Please try again later",

  [HttpStatusCode.INTERNAL_SERVER_ERROR]: "Internal server error",
  [HttpStatusCode.NOT_IMPLEMENTED]: "Feature not implemented",
  [HttpStatusCode.BAD_GATEWAY]: "Bad gateway",
  [HttpStatusCode.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
  [HttpStatusCode.GATEWAY_TIMEOUT]: "Gateway timeout",
};

// Helper functions for status code checking
export const HttpStatusHelpers = {
  isSuccess: (code: number): boolean => code >= 200 && code < 300,
  isRedirection: (code: number): boolean => code >= 300 && code < 400,
  isClientError: (code: number): boolean => code >= 400 && code < 500,
  isServerError: (code: number): boolean => code >= 500 && code < 600,
  isError: (code: number): boolean => code >= 400,

  getErrorMessage: (code: number): string => {
    return (
      HttpErrorMessages[code as HttpStatusCode] || `Unknown error (${code})`
    );
  },
};

// Custom error types for specific business logic
export enum AppErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",

  // Validation errors
  REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",
  INVALID_EMAIL_FORMAT = "INVALID_EMAIL_FORMAT",
  PASSWORD_TOO_WEAK = "PASSWORD_TOO_WEAK",

  // Business logic errors
  ORDER_NOT_FOUND = "ORDER_NOT_FOUND",
  INSUFFICIENT_PERMISSION = "INSUFFICIENT_PERMISSION",
  RESOURCE_LIMIT_EXCEEDED = "RESOURCE_LIMIT_EXCEEDED",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export const AppErrorMessages: Record<AppErrorCode, string> = {
  [AppErrorCode.INVALID_CREDENTIALS]: "Invalid username or password",
  [AppErrorCode.TOKEN_EXPIRED]: "Session expired, please login again",
  [AppErrorCode.ACCOUNT_LOCKED]: "Account is locked, contact support",

  [AppErrorCode.REQUIRED_FIELD_MISSING]: "Required field is missing",
  [AppErrorCode.INVALID_EMAIL_FORMAT]: "Invalid email format",
  [AppErrorCode.PASSWORD_TOO_WEAK]: "Password does not meet requirements",

  [AppErrorCode.ORDER_NOT_FOUND]: "Order not found",
  [AppErrorCode.INSUFFICIENT_PERMISSION]: "Insufficient permissions",
  [AppErrorCode.RESOURCE_LIMIT_EXCEEDED]: "Resource limit exceeded",

  [AppErrorCode.NETWORK_ERROR]: "Network connection error",
  [AppErrorCode.TIMEOUT]: "Request timeout",
  [AppErrorCode.UNKNOWN_ERROR]: "An unknown error occurred",
};
