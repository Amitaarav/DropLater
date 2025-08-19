import crypto from 'crypto';

export const generateIdempotencyKey = (noteId, releaseAt) => {
  const input = `${noteId}:${releaseAt}`;
  return crypto.createHash('sha256').update(input).digest('hex');
};

export default { generateIdempotencyKey };