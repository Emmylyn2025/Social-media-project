
export class appError extends Error{
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const asyncHandler = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  }
}