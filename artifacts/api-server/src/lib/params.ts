import type { Request } from "express";

/**
 * Extracts a route parameter as a scalar string.
 *
 * @types/express v5 types req.params values as `string | string[]`.
 * Drizzle's eq() only accepts `string | SQLWrapper`, so passing the
 * raw param value is a TS2769 error.  This helper normalises to a plain
 * string so every call-site stays strongly typed without unsafe casts.
 */
export function getParam(req: Request, name: string): string {
  const val = req.params[name];
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

/**
 * Extracts a query-string parameter as a scalar string or undefined.
 *
 * Express / qs types query values as `string | string[] | ParsedQs | …`.
 * This normalises to `string | undefined` safe for eq() and string ops.
 */
export function getQueryStr(req: Request, name: string): string | undefined {
  const val = req.query[name];
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  return undefined;
}
