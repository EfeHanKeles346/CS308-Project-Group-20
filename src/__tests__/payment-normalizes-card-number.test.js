import { describe, it, expect } from 'vitest';
import { normalizeCardNumber } from '../utils/paymentValidation';

describe('normalizeCardNumber', () => {
  it('strips non-digit characters and limits to 16 digits', () => {
    expect(normalizeCardNumber('1234-5678-9012-3456')).toBe('1234567890123456');
    expect(normalizeCardNumber('1234 5678 9012 3456 789')).toBe('1234567890123456');
  });
});
