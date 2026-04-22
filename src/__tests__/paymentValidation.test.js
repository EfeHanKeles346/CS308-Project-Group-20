import { describe, expect, it } from 'vitest';
import {
  formatCardNumber,
  formatExpiry,
  validateAddress,
  validateCard,
} from '../utils/paymentValidation';

describe('paymentValidation', () => {
  it('formats card number into groups of four digits', () => {
    expect(formatCardNumber('1234567890123456')).toBe('1234 5678 9012 3456');
  });

  it('formats expiry into MM/YY', () => {
    expect(formatExpiry('1230')).toBe('12/30');
  });

  it('rejects invalid card details', () => {
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

  it('accepts complete address data', () => {
    expect(validateAddress({
      fullName: 'Jane Doe',
      phone: '+90 555 555 55 55',
      line1: 'Example street',
      line2: '',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    })).toEqual({});
  });
});
