import { describe, it, expect } from 'vitest';
import { validateAddress } from '../utils/paymentValidation';

describe('validateAddress', () => {
  it('accepts a fully populated address and returns no errors', () => {
    expect(validateAddress({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+90 555 555 55 55',
      line1: 'Example street',
      line2: '',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    })).toEqual({});
  });
});
