export const sanitizeInput = (input: string): string => {
  if (!input) return "";

  let sanitized = input.trim();

  sanitized = sanitized.replace(/<[^>]*>?/gm, "");

  sanitized = sanitized.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  return sanitized;
};
