import { Request } from 'express';

// Extends Express Request to include authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}
