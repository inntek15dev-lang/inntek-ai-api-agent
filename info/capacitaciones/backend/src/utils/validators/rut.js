/**
 * Utility to validate Chilean RUT (Rol Único Tributario)
 */
const validateRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return false;
  
  // Clean dots and dash
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (cleanRUT.length < 8) return false;

  const dv = cleanRUT.slice(-1);
  const body = cleanRUT.slice(0, -1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDV = 11 - (sum % 11);
  let dvStr = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();

  return dv === dvStr;
};

/**
 * Format RUT to standard numeric-dash: 12345678-K
 */
const formatRUT = (rut) => {
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return clean;
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  return `${body}-${dv}`;
};

module.exports = { validateRUT, formatRUT };
