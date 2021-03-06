/**
 * An API exception object to be used from API interfaces.
 * @param {String} message Human-readable message with details about the exception.
 */
export function ApiException(message) {
  this.message = message;
  // Use V8's native method if available, otherwise fallback
  if ("captureStackTrace" in Error)
      Error.captureStackTrace(this, ApiException);
  else
      this.stack = (new Error()).stack;
}

ApiException.prototype = Object.create(Error.prototype);
ApiException.prototype.name = "ApiException";
ApiException.prototype.constructor = ApiException;