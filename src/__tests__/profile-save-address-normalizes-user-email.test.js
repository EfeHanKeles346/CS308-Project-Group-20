import { afterEach, describe, expect, it } from 'vitest';
import { getSavedAddress, saveAddress } from '../utils/profileStorage';

describe('saveAddress', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('saveAddress normalizes a stale address email to the logged-in user email', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const address = {
      fullName: 'John Recipient',
      email: 'old@example.com',
      phone: '+90 555 555 55 55',
      line1: 'Provided street 12',
      line2: 'Apartment 7',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    };
    const expectedAddress = {
      ...address,
      email: 'jane@example.com',
    };

    // Act
    const savedAddress = saveAddress(user, address);
    const storedAddress = JSON.parse(localStorage.getItem('techmind_profile_address:jane@example.com'));
    const retrievedAddress = getSavedAddress(user);

    // Assert
    expect(savedAddress).toEqual(expectedAddress);
    expect(storedAddress).toEqual(expectedAddress);
    expect(retrievedAddress).toEqual(expectedAddress);
  });
});
