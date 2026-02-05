import { Response } from 'express';

const sendResponse = <T>(
  res: Response,
  jsonData: {
    statusCode: number;
    success: true;
    message: string;
    meta?: { total: number; page: number; limit: number };
    data?: T;
  },
) => {
  const responseBody = {
    statusCode: jsonData.statusCode,
    success: jsonData.success,
    message: jsonData.message,
    meta: jsonData.meta,
    data: jsonData.data,
  };

  res.status(jsonData.statusCode).json(responseBody);
};

export default sendResponse;
