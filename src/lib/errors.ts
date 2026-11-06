export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code = 'INTERNAL_ERROR', statusCode = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request.', details?: unknown) {
    super(message, 'BAD_REQUEST', 400, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required. Please sign in.') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to access this resource.') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found.') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please slow down.', details?: unknown) {
    super(message, 'TOO_MANY_REQUESTS', 429, details);
  }
}

export class AiInvalidOutputError extends AppError {
  constructor(message = 'AI model generated output that does not match the required schema.', details?: unknown) {
    super(message, 'AI_INVALID_OUTPUT', 422, details);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string, details?: unknown, code = 'QUOTA_EXCEEDED') {
    super(message, code, 429, details);
  }
}

export class AiProviderError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'AI_PROVIDER_ERROR', 502, details);
  }
}
