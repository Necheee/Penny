const MINOR_UNITS_PER_MAJOR = 100n;

export function toMinorUnits(value) {
  const normalized = String(value ?? '0').replace(/,/g, '').trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return 0n;
  }

  const sign = normalized.startsWith('-') ? -1n : 1n;
  const unsigned = normalized.replace(/^-/, '');
  const [whole = '0', fraction = ''] = unsigned.split('.');
  const paddedFraction = fraction.padEnd(3, '0');
  const minor = BigInt(paddedFraction.slice(0, 2) || '0');
  const roundedMinor = minor + (paddedFraction[2] >= '5' ? 1n : 0n);

  return sign * (BigInt(whole || '0') * MINOR_UNITS_PER_MAJOR + roundedMinor);
}

export function fromMinorUnits(value) {
  try {
    const minorUnits = typeof value === 'bigint' ? value : BigInt(Math.round(Number(value) || 0));
    const sign = minorUnits < 0n ? '-' : '';
    const absolute = minorUnits < 0n ? -minorUnits : minorUnits;
    return `${sign}${absolute / MINOR_UNITS_PER_MAJOR}.${String(absolute % MINOR_UNITS_PER_MAJOR).padStart(2, '0')}`;
  } catch (err) {
    return '0.00';
  }
}

export function addMoney(...values) {
  return fromMinorUnits(values.reduce((total, value) => total + toMinorUnits(value), 0n));
}

export function multiplyMoney(value, quantity) {
  const qty = BigInt(Math.max(0, Math.round(Number(quantity) || 0)));
  return fromMinorUnits(toMinorUnits(value) * qty);
}

export function formatMoney(value) {
  const decimal = fromMinorUnits(toMinorUnits(value));
  const [whole, fraction] = decimal.split('.');
  const sign = whole.startsWith('-') ? '-' : '';
  const unsignedWhole = sign ? whole.slice(1) : whole;
  return `${sign}${unsignedWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
}
