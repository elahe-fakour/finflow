export type ApiErrorDetail = {
  field: string;
  messages: string[];
};

export type ApiErrorResponse = {
  statusCode: number;
  error: string;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  path: string;
  timestamp: string;
};
