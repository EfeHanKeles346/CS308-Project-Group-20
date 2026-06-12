import { describe, expect, it } from 'vitest';
import { createAddressDraft } from '../utils/profileStorage';

describe('createAddressDraft', () => {
  it('createAddressDraft preserves provided address fields', () => {
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

    // Act
    const draft = createAddressDraft(user, address);

    // Assert
    expect(draft).toEqual({
      ...address,
      email: 'jane@example.com',
    });
  });

  it('preserves empty strings supplied for optional and editable fields', () => {
    // Arrange
    const user = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    const address = {
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: '',
    };

    // Act
    const draft = createAddressDraft(user, address);

    // Assert
    expect(draft).toEqual({
      ...address,
      email: 'jane@example.com',
    });
  });

  it('uses the logged-in user email when a saved address has a stale email', () => {
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

    // Act
    const draft = createAddressDraft(user, address);

    // Assert
    expect(draft).toEqual({
      ...address,
      email: 'jane@example.com',
    });
  });
});
