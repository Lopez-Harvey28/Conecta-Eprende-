const GIBBERISH_PATTERNS = [
  /\b(?:asdf|qwer|werfq|zxcv|lorem ipsum)\w*\b/i,
  /(.)\1{4,}/i,
  /(?:[bcdfghjklmnpqrstvwxyz]{7,})/i,
];

export function sanitizePlainText(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

export function isLowQualityText(value: string) {
  const text = sanitizePlainText(value);
  if (!text) return true;
  if (GIBBERISH_PATTERNS.some((pattern) => pattern.test(text))) return true;
  const letters = text.match(/[a-záéíóúüñ]/gi) ?? [];
  const vowels = text.match(/[aeiouáéíóúü]/gi) ?? [];
  return letters.length >= 10 && vowels.length / letters.length < 0.15;
}

export function publicTextError(value: string, minimum: number, label: string) {
  const text = sanitizePlainText(value);
  if (text.length < minimum) return `${label} debe tener al menos ${minimum} caracteres.`;
  if (isLowQualityText(text)) return `${label} necesita información clara y comprensible.`;
  return null;
}
