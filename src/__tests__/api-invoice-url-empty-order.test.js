import { describe, it, expect } from 'vitest';
import { getInvoiceDownloadUrl } from '../services/api';

describe('getInvoiceDownloadUrl', () => {
  it('returns null without orderId', () => {
    expect(getInvoiceDownloadUrl(null)).toBeNull();
    expect(getInvoiceDownloadUrl('')).toBeNull();
    expect(getInvoiceDownloadUrl(undefined)).toBeNull();
  });
});
