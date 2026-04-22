import { buildWhatsappUrl, normalizeWhatsappNumber } from './whatsapp';

describe('whatsapp utils', () => {
  it('normalizes numbers to digits only', () => {
    expect(normalizeWhatsappNumber('+233 20 454 0076')).toBe('233204540076');
  });

  it('builds a wa.me URL for a valid number', () => {
    expect(buildWhatsappUrl('+233 20 454 0076', 'Hello there')).toBe(
      'https://wa.me/233204540076?text=Hello%20there',
    );
  });

  it('returns null when the number is missing', () => {
    expect(buildWhatsappUrl('', 'Hello there')).toBeNull();
  });
});
