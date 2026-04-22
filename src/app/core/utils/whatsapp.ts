export function normalizeWhatsappNumber(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function buildWhatsappUrl(
  number: string | null | undefined,
  message: string,
): string | null {
  const normalizedNumber = normalizeWhatsappNumber(number);

  if (!normalizedNumber) {
    return null;
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}
