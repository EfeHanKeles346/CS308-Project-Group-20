import { describe, it, expect } from 'vitest';
import { validateExpiry } from '../utils/paymentValidation';

describe('validateExpiry', () => {
  it('rejects a card expiry date that is in the past', () => {
    expect(validateExpiry('0120')).toBe('Card expiry date is in the past.');
  });
});
