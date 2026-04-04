export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message = "Bad request") {
    return new ApiError(400, message, "BAD_REQUEST");
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden: insufficient permissions") {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(409, message, "CONFLICT");
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }
}
