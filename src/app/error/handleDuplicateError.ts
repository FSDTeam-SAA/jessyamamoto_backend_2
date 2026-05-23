<<<<<<< HEAD
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
=======
import { TErrorSources, TGenericErrorResponse } from '../interface';

const handleDuplicateError = (err: any): TGenericErrorResponse => {
  // Extract value within double quotes using regex
  const match = err.message.match(/"([^"]*)"/);

  // The extracted value will be in the first capturing group
  const extractedMessage = match && match[1];

  const errorSources: TErrorSources = [
    {
      path: '',
      message: `${extractedMessage} is already exists`,
    },
  ];

  const statusCode = 400;

  return {
    statusCode,
    message: 'Invalid ID',
    errorSources,
  };
};

export default handleDuplicateError;
>>>>>>> 367691bd2b156c5ea95dcb576ab8f4898587548e
