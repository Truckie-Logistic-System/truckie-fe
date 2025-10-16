// HTTP Status Codes
export enum HttpStatusCode {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 3xx Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,

  // 4xx Client Error
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Error
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Error messages for each status code
export const HttpErrorMessages: Record<HttpStatusCode, string> = {
  [HttpStatusCode.OK]: "Success",
  [HttpStatusCode.CREATED]: "Resource created SUCCESSFUL",
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

// Helper functions for HTTP status codes
export const HttpStatusHelpers = {
  isSuccess: (code: number) => code >= 200 && code < 300,
  isRedirection: (code: number) => code >= 300 && code < 400,
  isClientError: (code: number) => code >= 400 && code < 500,
  isServerError: (code: number) => code >= 500 && code < 600,
  getErrorMessage: (code: number) =>
    HttpErrorMessages[code as HttpStatusCode] || `Unknown error (${code})`,
};

// Application-specific error codes
export enum AppErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Application-specific error messages
export const AppErrorMessages: Record<AppErrorCode, string> = {
  [AppErrorCode.NETWORK_ERROR]:
    "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.",
  [AppErrorCode.AUTHENTICATION_ERROR]:
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  [AppErrorCode.AUTHORIZATION_ERROR]:
    "Bạn không có quyền truy cập vào tài nguyên này.",
  [AppErrorCode.VALIDATION_ERROR]:
    "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
  [AppErrorCode.NOT_FOUND_ERROR]: "Không tìm thấy tài nguyên yêu cầu.",
  [AppErrorCode.SERVER_ERROR]:
    "Đã xảy ra lỗi từ máy chủ. Vui lòng thử lại sau.",
  [AppErrorCode.UNKNOWN_ERROR]:
    "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
};
