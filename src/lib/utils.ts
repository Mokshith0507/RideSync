export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return 'XXXXXXX' + phone.slice(-3);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return '₹' + amount.toFixed(2);
}
