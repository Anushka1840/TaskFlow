import { Response } from 'express';

// Consistent response shape across ALL endpoints:
// { success: true/false, data: {...}, message: "..." }

export const sendSuccess = (
  res: Response,
  data: any,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};
