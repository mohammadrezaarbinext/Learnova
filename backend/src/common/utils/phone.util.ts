export const IRANIAN_MOBILE_REGEX = /^09\d{9}$/;

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeIranianPhone(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  let phone = value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[\s()-]/g, '');

  if (phone.startsWith('+98')) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith('0098')) {
    phone = `0${phone.slice(4)}`;
  } else if (phone.startsWith('98') && phone.length === 12) {
    phone = `0${phone.slice(2)}`;
  } else if (phone.startsWith('9') && phone.length === 10) {
    phone = `0${phone}`;
  }

  return phone;
}

export function toIranianPhone(value: string): string {
  return normalizeIranianPhone(value) as string;
}
