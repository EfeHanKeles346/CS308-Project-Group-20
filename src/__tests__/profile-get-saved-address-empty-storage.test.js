import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyAddress, getSavedAddress } from '../utils/profileStorage';

describe('getSavedAddress', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getSavedAddress returns a default draft when storage is empty', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    // Act
    const address = getSavedAddress(user);

    // Assert
    expect(getItem).toHaveBeenCalledWith('techmind_profile_address:jane@example.com');
    expect(address).toEqual({
      ...emptyAddress,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
    });
  });

  it('returns an empty guest draft when storage is empty and no user is logged in', () => {
    // Arrange
    const user = undefined;
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    // Act
    const address = getSavedAddress(user);

    // Assert
    expect(getItem).toHaveBeenCalledWith('techmind_profile_address:guest');
    expect(address).toEqual(emptyAddress);
  });

  it('returns a default draft when saved address JSON cannot be parsed', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{invalid-json');

    // Act
    const address = getSavedAddress(user);

    // Assert
    expect(address).toEqual({
      ...emptyAddress,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
    });
  });
});
