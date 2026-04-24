export function normalizeCardNumber(value = '') {
  return value.replace(/\D/g, '').slice(0, 16);
}

export function formatCardNumber(value = '') {
  return normalizeCardNumber(value).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiry(value = '') {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function normalizeCvv(value = '') {
  return value.replace(/\D/g, '').slice(0, 3);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAddress(address) {
  const errors = {};

  if (!address.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!address.email || !address.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(address.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!address.phone.trim()) errors.phone = 'Phone number is required.';
  if (!address.line1.trim()) errors.line1 = 'Address line is required.';
  if (!address.city.trim()) errors.city = 'City is required.';
  if (!address.postalCode.trim()) errors.postalCode = 'Postal code is required.';
  if (!address.country.trim()) errors.country = 'Country is required.';

  return errors;
}

export function validateExpiry(value = '') {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 4) {
    return 'Expiry date must be in MM/YY format.';
  }

  const month = Number(digits.slice(0, 2));
  const year = Number(`20${digits.slice(2)}`);

  if (month < 1 || month > 12) {
    return 'Enter a valid expiry month.';
  }

  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const expiryMonth = new Date(year, month - 1, 1);

  if (expiryMonth < currentMonth) {
    return 'Card expiry date is in the past.';
  }

  return '';
}

export function validateCard(card) {
  const errors = {};
  const cardDigits = normalizeCardNumber(card.cardNumber);
  const cvvDigits = normalizeCvv(card.cvv);
  const expiryError = validateExpiry(card.expiry);

  if (!card.cardholderName.trim()) {
    errors.cardholderName = 'Name on card is required.';
  }

  if (cardDigits.length !== 16) {
    errors.cardNumber = 'Card number must be 16 digits.';
  }

  if (cvvDigits.length !== 3) {
    errors.cvv = 'Security code must be 3 digits.';
  }

  if (expiryError) {
    errors.expiry = expiryError;
  }

  return errors;
}
