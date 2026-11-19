const MINOR_UNITS_PER_MAJOR = 100;

export function toMinorUnits(value) {
  const normalized = String(value ?? '0').trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid currency value: ${value}`);
  }

  const sign = normalized.startsWith('-') ? -1 : 1;
  const unsigned = normalized.replace(/^-/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  const paddedFraction = fraction.padEnd(3, '0');
  const minor = Number(paddedFraction.slice(0, 2));
  const roundedMinor = minor + (Number(paddedFraction[2]) >= 5 ? 1 : 0);

  return sign * (Number(whole) * MINOR_UNITS_PER_MAJOR + roundedMinor);
}

export function fromMinorUnits(value) {
  return value / MINOR_UNITS_PER_MAJOR;
}
