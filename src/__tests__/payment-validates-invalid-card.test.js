import { describe, it, expect } from 'vitest';
import { validateCard } from '../utils/paymentValidation';

describe('validateCard', () => {
  it('rejects card with missing name, short number, short cvv, and past expiry', () => {
    expect(validateCard({
      cardholderName: '',
      cardNumber: '1234',
      expiry: '01/20',
      cvv: '1',
    })).toMatchObject({
      cardholderName: 'Name on card is required.',
      cardNumber: 'Card number must be 16 digits.',
      cvv: 'Security code must be 3 digits.',
      expiry: 'Card expiry date is in the past.',
    });
  });
});
