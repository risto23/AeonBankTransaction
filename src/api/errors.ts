/** The device has no usable internet connection. */
export class NetworkError extends Error {
  constructor(
    message = 'No internet connection. Check your connection and try again.',
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/** The server did not answer in time. */
export class TimeoutError extends Error {
  constructor(
    message = 'The server is taking too long to respond. Please try again.',
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}
