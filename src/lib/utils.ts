export function generateSessionCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generatePassword(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export function formatWaNumber(wa: string): string {
  const cleaned = wa.replace(/\D/g, "");
  if (cleaned.startsWith("08")) return "62" + cleaned.slice(1);
  if (cleaned.startsWith("628")) return cleaned;
  return cleaned;
}

export function isValidWaNumber(wa: string): boolean {
  const cleaned = wa.replace(/\D/g, "");
  return /^(08|628)\d{8,12}$/.test(cleaned);
}

export function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function sanitizeText(text: string): string {
  return text.trim().slice(0, 5000);
}
