export const ApiError = (message) => ({
  error: new Error(message),
  code: 'API_ERROR'
});