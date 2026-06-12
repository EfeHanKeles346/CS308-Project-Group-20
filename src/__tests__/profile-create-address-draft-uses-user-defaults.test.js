import { describe, expect, it } from 'vitest';
import { createAddressDraft, emptyAddress } from '../utils/profileStorage';

describe('createAddressDraft', () => {
  it('createAddressDraft uses logged-in user defaults', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    // Act
    const draft = createAddressDraft(user);

    // Assert
    expect(draft).toEqual({
      ...emptyAddress,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
    });
  });

  it('uses an empty full name when the logged-in user has no name', () => {
    // Arrange
    const user = {
      email: 'nameless@example.com',
    };

    // Act
    const draft = createAddressDraft(user);

    // Assert
    expect(draft).toEqual({
      ...emptyAddress,
      fullName: '',
      email: 'nameless@example.com',
    });
  });

  it('returns an empty draft for a guest user', () => {
    // Arrange
    const user = undefined;

    // Act
    const draft = createAddressDraft(user);

    // Assert
    expect(draft).toEqual(emptyAddress);
  });
});
