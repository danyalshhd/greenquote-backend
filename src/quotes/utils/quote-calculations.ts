import { Offer } from '../interface/offer.interface';

const paymentCache = new Map<string, number>();

export function systemPriceFor(sizeKw: number): number {
  return sizeKw * 1200;
}

export function computeRiskBand(
  monthlyConsumptionKwh: number,
  systemSizeKw: number,
): 'A' | 'B' | 'C' {
  if (monthlyConsumptionKwh >= 400 && systemSizeKw <= 6) return 'A';
  if (monthlyConsumptionKwh >= 250) return 'B';
  return 'C';
}

export function aprForBand(band: string): number {
  if (band === 'A') return 6.9;
  if (band === 'B') return 8.9;
  return 11.9;
}

export function monthlyPayment(
  principal: number,
  aprPercent: number,
  termYears: number,
): number {
  const key = `${principal}-${aprPercent}-${termYears}`;
  if (paymentCache.has(key)) return paymentCache.get(key)!;

  const r = aprPercent / 100 / 12;
  const n = termYears * 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  const payment =
    (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  const rounded = Number(payment.toFixed(2));
  paymentCache.set(key, rounded);
  return rounded;
}

export function buildOffers(principal: number, band: string): Offer[] {
  const apr = aprForBand(band);
  const terms = [5, 10, 15];
  return terms.map((t) => ({
    termYears: t,
    apr,
    principalUsed: Number(principal.toFixed(2)),
    monthlyPayment: monthlyPayment(principal, apr, t),
  }));
}
