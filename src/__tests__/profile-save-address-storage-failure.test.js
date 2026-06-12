import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveAddress } from '../utils/profileStorage';

describe('saveAddress', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('saveAddress throws when localStorage fails to persist the address', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const address = {
      fullName: 'John Recipient',
      phone: '+90 555 555 55 55',
      line1: 'Provided street 12',
      line2: 'Apartment 7',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    };
    const storageError = new Error('Storage unavailable');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw storageError;
    });

    // Act
    const save = () => saveAddress(user, address);

    // Assert
    expect(save).toThrow(storageError);
    expect(localStorage.getItem('techmind_profile_address:jane@example.com')).toBeNull();
  });
});
