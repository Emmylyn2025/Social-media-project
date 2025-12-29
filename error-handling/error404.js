
export class appError extends Error{
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}

export const asyncHandler = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  }
}