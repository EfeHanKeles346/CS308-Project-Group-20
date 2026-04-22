const ADDRESS_STORAGE_PREFIX = 'techmind_profile_address';

export const emptyAddress = Object.freeze({
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: '',
});

function getStorageKey(user) {
  return `${ADDRESS_STORAGE_PREFIX}:${user?.email || 'guest'}`;
}

export function createAddressDraft(user, address = {}) {
  return {
    ...emptyAddress,
    fullName: user?.name || '',
    ...address,
  };
}

export function getSavedAddress(user) {
  try {
    const raw = localStorage.getItem(getStorageKey(user));
    if (!raw) return createAddressDraft(user);

    return createAddressDraft(user, JSON.parse(raw));
  } catch {
    return createAddressDraft(user);
  }
}

export function saveAddress(user, address) {
  const nextAddress = createAddressDraft(user, address);
  localStorage.setItem(getStorageKey(user), JSON.stringify(nextAddress));
  return nextAddress;
}
