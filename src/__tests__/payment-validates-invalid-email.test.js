import { describe, it, expect } from 'vitest';
import { validateAddress } from '../utils/paymentValidation';

describe('validateAddress', () => {
  it('rejects a malformed email address', () => {
    const errors = validateAddress({
      fullName: 'Jane Doe',
      email: 'not-an-email',
      phone: '+90 555 555 55 55',
      line1: 'Example street',
      line2: '',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    });
    expect(errors.email).toBe('Enter a valid email address.');
  });
});
