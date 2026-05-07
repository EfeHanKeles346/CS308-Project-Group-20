import { describe, it, expect } from 'vitest';
import { formatCardNumber } from '../utils/paymentValidation';

describe('formatCardNumber', () => {
  it('formats 16-digit string into groups of four', () => {
    expect(formatCardNumber('1234567890123456')).toBe('1234 5678 9012 3456');
  });
});
