// Base API response types matching OpenAPI spec
export interface BaseSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface BaseErrorResponse {
  success: false;
  message: string;
  error_code:
    | "ERR_VALIDATION"
    | "ERR_UNAUTHORIZED"
    | "ERR_FORBIDDEN"
    | "ERR_NOT_FOUND"
    | "ERR_ALREADY_EXISTS"
    | "ERR_TOKEN_EXPIRED"
    | "ERR_INVALID_TOKEN"
    | "ERR_INTERNAL_SERVER";
  data: null;
}

export type ApiResponse<T = unknown> = BaseSuccessResponse<T> | BaseErrorResponse;
