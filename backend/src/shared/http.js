export class AppError extends Error {
  constructor(status, message, code = 'BAD_REQUEST', details) { super(message); this.status = status; this.code = code; this.details = details; }
}
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const ok = (res, data, meta) => res.json(meta ? { data, meta } : { data });
export const created = (res, data) => res.status(201).json({ data });
export const legacy = (res, data, status = 200) => res.status(status).json(data);
