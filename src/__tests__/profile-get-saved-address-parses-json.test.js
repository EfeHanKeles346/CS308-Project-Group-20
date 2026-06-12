import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSavedAddress } from '../utils/profileStorage';

describe('getSavedAddress', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getSavedAddress loads saved address from localStorage', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const savedAddress = {
      fullName: 'John Recipient',
      email: 'jane@example.com',
      phone: '+90 555 555 55 55',
      line1: 'Provided street 12',
      line2: 'Apartment 7',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    };
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockReturnValue(JSON.stringify(savedAddress));

    // Act
    const address = getSavedAddress(user);

    // Assert
    expect(getItem).toHaveBeenCalledWith('techmind_profile_address:jane@example.com');
    expect(address).toEqual(savedAddress);
  });

  it('merges partial saved address data with logged-in user defaults', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const savedAddress = {
      city: 'Istanbul',
      country: 'Turkey',
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(savedAddress));

    // Act
    const address = getSavedAddress(user);

    // Assert
    expect(address).toEqual({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '',
      line1: '',
      line2: '',
      city: 'Istanbul',
      postalCode: '',
      country: 'Turkey',
    });
  });

  it('uses the logged-in user email when saved JSON contains a stale email', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const savedAddress = {
      fullName: 'John Recipient',
      email: 'old@example.com',
      phone: '+90 555 555 55 55',
      line1: 'Provided street 12',
      line2: '',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(savedAddress));

    // Act
    const address = getSavedAddress(user);

    // Assert
    expect(address).toEqual({
      ...savedAddress,
      email: 'jane@example.com',
    });
  });
});
