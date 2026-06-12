import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyAddress, getSavedAddress } from '../utils/profileStorage';

describe('getSavedAddress', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getSavedAddress falls back when saved JSON is invalid', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{invalid-json');

    // Act
    const getAddress = () => getSavedAddress(user);

    // Assert
    expect(getAddress).not.toThrow();
    expect(getAddress()).toEqual({
      ...emptyAddress,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(getItem).toHaveBeenCalledWith('techmind_profile_address:jane@example.com');
  });

  it('falls back to an empty guest draft when guest storage contains invalid JSON', () => {
    // Arrange
    const user = undefined;
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('not-json');

    // Act
    const getAddress = () => getSavedAddress(user);

    // Assert
    expect(getAddress).not.toThrow();
    expect(getAddress()).toEqual(emptyAddress);
    expect(getItem).toHaveBeenCalledWith('techmind_profile_address:guest');
  });
});
