import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyAddress, getSavedAddress, saveAddress } from '../utils/profileStorage';

describe('saveAddress', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saveAddress stores and returns the user address', () => {
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
    const expectedAddress = {
      ...emptyAddress,
      ...address,
      email: 'jane@example.com',
    };
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    // Act
    const savedAddress = saveAddress(user, address);
    const storedJson = localStorage.getItem('techmind_profile_address:jane@example.com');
    const retrievedAddress = getSavedAddress(user);

    // Assert
    expect(setItem).toHaveBeenCalledWith(
      'techmind_profile_address:jane@example.com',
      JSON.stringify(expectedAddress),
    );
    expect(storedJson).toBe(JSON.stringify(expectedAddress));
    expect(JSON.parse(storedJson)).toEqual(expectedAddress);
    expect(savedAddress).toEqual(expectedAddress);
    expect(retrievedAddress).toEqual(expectedAddress);
  });

  it('stores a complete default-shaped address when provided address is partial', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const address = {
      city: 'Istanbul',
      country: 'Turkey',
    };
    const expectedAddress = {
      ...emptyAddress,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      city: 'Istanbul',
      country: 'Turkey',
    };

    // Act
    const savedAddress = saveAddress(user, address);
    const retrievedAddress = getSavedAddress(user);

    // Assert
    expect(savedAddress).toEqual(expectedAddress);
    expect(JSON.parse(localStorage.getItem('techmind_profile_address:jane@example.com'))).toEqual(
      expectedAddress,
    );
    expect(retrievedAddress).toEqual(expectedAddress);
  });

  it('stores guest addresses under the guest key', () => {
    // Arrange
    const user = undefined;
    const address = {
      fullName: 'Guest Recipient',
      email: 'guest@example.com',
      phone: '+90 555 555 55 55',
      line1: 'Guest street 12',
      line2: '',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    };

    // Act
    const savedAddress = saveAddress(user, address);
    const retrievedAddress = getSavedAddress(user);

    // Assert
    expect(localStorage.getItem('techmind_profile_address:guest')).toBe(JSON.stringify(address));
    expect(savedAddress).toEqual(address);
    expect(retrievedAddress).toEqual(address);
  });
});
