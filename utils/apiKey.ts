export const key = await crypto.subtle.generateKey(
  { name: 'HMAC', hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
);
