/**
 * Parses a color entry which can be either:
 * - Plain name:     "Blue"
 * - Name|hex pair: "Navy Blue|#1e3a5f"
 */
export interface ParsedColor {
  name: string;
  hex: string | null;
}

export function parseColor(raw: string): ParsedColor {
  const parts = raw.split('|');
  return {
    name: parts[0].trim(),
    hex: parts[1]?.trim() ?? null,
  };
}