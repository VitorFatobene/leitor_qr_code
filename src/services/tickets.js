export function extrairNumeroIngresso(qrValue) {
  const rawValue = String(qrValue || '').trim();
  const checkInToken = '/check-in/';
  const checkInIndex = rawValue.indexOf(checkInToken);

  if (checkInIndex === -1) {
    return '';
  }

  const valueAfterCheckIn = rawValue.slice(checkInIndex + checkInToken.length);
  const commaIndex = valueAfterCheckIn.indexOf(',');

  if (commaIndex === -1) {
    return '';
  }

  const ticketNumber = valueAfterCheckIn.slice(0, commaIndex).trim();

  return ticketNumber;
}
