import { describe, it, expect } from 'vitest';
import { validateAddress } from '../utils/paymentValidation';

describe('validateAddress', () => {
  it('reports errors for all missing required fields', () => {
    const errors = validateAddress({
      fullName: '',
      email: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: '',
    });
    expect(errors.fullName).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.line1).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.postalCode).toBeDefined();
    expect(errors.country).toBeDefined();
  });
});
