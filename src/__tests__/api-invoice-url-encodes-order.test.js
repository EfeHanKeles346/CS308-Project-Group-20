import { describe, it, expect } from 'vitest';
import { getInvoiceDownloadUrl } from '../services/api';

describe('getInvoiceDownloadUrl', () => {
  it('encodes orderId', () => {
    const url = getInvoiceDownloadUrl('ORD/2024-001');
    expect(url).toContain(encodeURIComponent('ORD/2024-001'));
  });
});
