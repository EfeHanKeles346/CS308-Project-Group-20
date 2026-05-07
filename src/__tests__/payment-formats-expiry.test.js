import { describe, it, expect } from 'vitest';
import { formatExpiry } from '../utils/paymentValidation';

describe('formatExpiry', () => {
  it('formats four digits into MM/YY', () => {
    expect(formatExpiry('1230')).toBe('12/30');
  });
});
