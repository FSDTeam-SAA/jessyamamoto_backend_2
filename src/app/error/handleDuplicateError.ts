import { TErrorSources, TGenericErrorResponse } from '../interface';

const handleDuplicateError = (err: any): TGenericErrorResponse => {
  const match = err.message.match(/"([^"]*)"/);
  const extractedMessage = match && match[1];
  const field =
    err.keyPattern && typeof err.keyPattern === 'object'
      ? Object.keys(err.keyPattern)[0]
      : '';
  const duplicateValue =
    err.keyValue && field && field in err.keyValue
      ? String(err.keyValue[field])
      : extractedMessage;

  const errorSources: TErrorSources = [
    {
      path: field,
      message: duplicateValue
        ? `${field || 'Value'} "${duplicateValue}" already exists`
        : `${extractedMessage || 'Value'} already exists`,
    },
  ];

  const statusCode = 400;

  return {
    statusCode,
    message: 'Duplicate value',
    errorSources,
  };
};

export default handleDuplicateError;
import { TErrorSources, TGenericErrorResponse } from '../interface';

const handleDuplicateError = (err: any): TGenericErrorResponse => {
  const match = err.message.match(/"([^"]*)"/);
  const extractedMessage = match && match[1];
  const field =
    err.keyPattern && typeof err.keyPattern === 'object'
      ? (Object.keys(err.keyPattern)[0] ?? '')
      : '';
  const duplicateValue =
    err.keyValue && field && field in err.keyValue
      ? String(err.keyValue[field])
      : extractedMessage;

  const errorSources: TErrorSources = [
    {
      path: field,
      message: duplicateValue
        ? `${field || 'Value'} "${duplicateValue}" already exists`
        : `${extractedMessage || 'Value'} already exists`,
    },
  ];

  const statusCode = 400;

  return {
    statusCode,
    message: 'Duplicate value',
    errorSources,
  };
};

export default handleDuplicateError;

