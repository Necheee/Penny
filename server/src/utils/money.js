const MINOR_UNITS_PER_MAJOR = 100n;

export function toMinorUnits(value) {
  const normalized = String(value ?? '0').trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid currency value: ${value}`);
  }

  const sign = normalized.startsWith('-') ? -1n : 1n;
  const unsigned = normalized.replace(/^-/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  const paddedFraction = fraction.padEnd(3, '0');
  const minor = BigInt(paddedFraction.slice(0, 2));
  const roundedMinor = minor + (BigInt(paddedFraction[2]) >= 5n ? 1n : 0n);

  return sign * (BigInt(whole) * MINOR_UNITS_PER_MAJOR + roundedMinor);
}

export function minorUnitsToDecimal(value) {
  const minorUnits = BigInt(value);
  const sign = minorUnits < 0n ? '-' : '';
  const absolute = minorUnits < 0n ? -minorUnits : minorUnits;
  const whole = absolute / MINOR_UNITS_PER_MAJOR;
  const fraction = String(absolute % MINOR_UNITS_PER_MAJOR).padStart(2, '0');
  return `${sign}${whole}.${fraction}`;
}

export function formatMoney(value) {
  const decimal = minorUnitsToDecimal(toMinorUnits(value));
  const [whole, fraction] = decimal.split('.');
  const sign = whole.startsWith('-') ? '-' : '';
  const unsignedWhole = sign ? whole.slice(1) : whole;
  return `${sign}${unsignedWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
}

export function multiplyMoney(value, quantity) {
  return minorUnitsToDecimal(toMinorUnits(value) * BigInt(quantity));
}
