/** Small request helpers shared by the controllers. */

/** Escape user text before putting it in a RegExp (prevents regex injection / ReDoS). */
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Build a Mongo filter from untrusted input: keep only real schema fields and
 * primitive values, so callers cannot inject operators such as `$where` or `$ne`.
 * Empty strings are dropped (the frontend sends blank form fields).
 */
const pickFilter = (Model, input = {}, blocked = []) => {
  const filter = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (key.startsWith("$") || key.includes(".") || blocked.includes(key)) continue;
    if (!Model.schema.path(key)) continue;
    if (value === "" || value === null || value === undefined) continue;
    if (["string", "number", "boolean"].includes(typeof value)) {
      filter[key] = typeof value === "string" ? value.trim() : value;
    }
  }
  return filter;
};

/**
 * Copy allowed, primitive fields from untrusted input onto an update object.
 * Used when creating or selling stock so a client cannot overwrite ownership or ids.
 */
const pickFields = (Model, input = {}, blocked = []) => {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (key.startsWith("$") || key.includes(".") || blocked.includes(key)) continue;
    if (!Model.schema.path(key)) continue;
    if (value === "" || value === null || value === undefined) continue;
    if (typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) continue;
    out[key] = typeof value === "string" ? value.trim() : value;
  }
  return out;
};

/**
 * Minimal in-memory rate limiter (per IP + route). Good enough for a single
 * server instance; swap for a shared store if you run several instances.
 */
const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20, message = "Too many attempts. Please try again later." } = {}) => {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ message });
    }
    next();
  };
};

module.exports = { escapeRegex, pickFilter, pickFields, rateLimit };
