// Simple validation helpers for Posts

export function isValidNumericId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export function validateCreatePostBody(body) {
  const { userid, content, reviewid } = body || {};

  if (userid === undefined || reviewid === undefined || !content) {
    return "Missing required fields (userid, content, reviewid)";
  }

  if (typeof userid !== "number" && typeof userid !== "string") return "userid must be a number or string";
  if (!Number.isInteger(Number(reviewid))) return "reviewid must be an integer";

  if (typeof content !== "string" || content.trim().length === 0) {
    return "content must be a non-empty string";
  }

  return null;
}

export function validateUpdatePostBody(body) {
  const { content } = body || {};
  if (!content) return "Missing content field";
  if (typeof content !== "string" || content.trim().length === 0) {
    return "content must be a non-empty string";
  }
  return null;
}
